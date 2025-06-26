import { GitHubClient } from './github-client.ts';
import type { GitHubIssue, GitHubComment, IssueContext, FileContent, CodeReference } from './types.ts';

export class ContextGatherer {
  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async gatherIssueContext(owner: string, repo: string, issue: GitHubIssue): Promise<IssueContext> {
    const context: IssueContext = {
      issue: {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels.map(label => label.name),
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      },
      comments: [],
      relatedFiles: [],
      codeReferences: [],
    };

    try {
      context.comments = await this.githubClient.getIssueComments(owner, repo, issue.number);
      
      const fileReferences = this.extractFileReferences(issue.body, context.comments);
      context.relatedFiles = await this.getRelatedFileContents(owner, repo, fileReferences);
      
      const codeKeywords = this.extractCodeKeywords(issue.body, context.comments);
      context.codeReferences = await this.searchForCodeReferences(owner, repo, codeKeywords);
      
    } catch (error: any) {
      console.error(`Error gathering context for issue #${issue.number}:`, error.message);
    }

    return context;
  }

  private extractFileReferences(issueBody: string | null, comments: GitHubComment[]): string[] {
    const filePattern = /(?:^|\s)([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.\/-]+\.[a-zA-Z]{1,4})|(?:^|\s)([a-zA-Z0-9_.-]+\.[a-zA-Z]{1,4})/g;
    const files = new Set<string>();
    
    const allText = [issueBody || '', ...comments.map(c => c.body)].join(' ');
    
    let match;
    while ((match = filePattern.exec(allText)) !== null) {
      const file = match[1] || match[2];
      if (file && this.isValidFilePath(file)) {
        files.add(file);
      }
    }
    
    return Array.from(files);
  }

  private extractCodeKeywords(issueBody: string | null, comments: GitHubComment[]): string[] {
    const allText = [issueBody || '', ...comments.map(c => c.body)].join(' ');
    
    const functionPattern = /(?:function|def|class|method)\s+(\w+)/gi;
    const variablePattern = /(?:const|let|var|@\w+)\s+(\w+)/gi;
    const errorPattern = /(Error|Exception|Bug|Issue):\s*(\w+)/gi;
    
    const keywords = new Set<string>();
    
    [functionPattern, variablePattern, errorPattern].forEach(pattern => {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        if (match[1] && match[1].length > 2) {
          keywords.add(match[1]);
        }
      }
    });
    
    return Array.from(keywords);
  }

  private async getRelatedFileContents(owner: string, repo: string, filePaths: string[]): Promise<FileContent[]> {
    const fileContents: FileContent[] = [];
    
    for (const filePath of filePaths) {
      try {
        const content = await this.githubClient.getFileContent(owner, repo, filePath);
        if (content) {
          fileContents.push({
            path: filePath,
            content: content.substring(0, 5000),
          });
        }
      } catch (error: any) {
        console.error(`Error fetching file ${filePath}:`, error.message);
      }
    }
    
    return fileContents;
  }

  private async searchForCodeReferences(owner: string, repo: string, keywords: string[]): Promise<CodeReference[]> {
    const codeReferences: CodeReference[] = [];
    
    for (const keyword of keywords.slice(0, 5)) {
      try {
        const results = await this.githubClient.searchCode(owner, repo, keyword);
        codeReferences.push({
          keyword,
          matches: results.slice(0, 3).map(result => ({
            path: result.path,
            url: result.html_url,
          })),
        });
      } catch (error: any) {
        console.error(`Error searching for keyword "${keyword}":`, error.message);
      }
    }
    
    return codeReferences;
  }

  private isValidFilePath(path: string): boolean {
    const validExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.css', '.html', '.vue', '.php', '.rb', '.go', '.rs', '.swift', '.kt'];
    const invalidPaths = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    
    if (invalidPaths.includes(path)) return false;
    
    return validExtensions.some(ext => path.endsWith(ext)) || path.includes('/');
  }
}