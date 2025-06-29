import { Octokit } from '@octokit/rest';
import type { GitHubIssue, GitHubComment, IssueContext, FileContent, CodeReference } from '../types';

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async getIssues(owner: string, repo: string, options: any = {}): Promise<GitHubIssue[]> {
    try {
      const allIssues: GitHubIssue[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        const { data } = await this.octokit.rest.issues.listForRepo({
          owner,
          repo,
          state: 'open',
          sort: 'created',
          direction: 'desc',
          per_page: perPage,
          page,
          ...options,
        });

        if (data.length === 0) {
          break;
        }

        allIssues.push(...(data as GitHubIssue[]));
        
        if (data.length < perPage) {
          break;
        }
        
        page++;
      }

      return allIssues;
    } catch (error: any) {
      console.error('Error fetching issues:', error.message);
      throw error;
    }
  }

  async getIssueComments(owner: string, repo: string, issueNumber: number): Promise<GitHubComment[]> {
    try {
      const { data } = await this.octokit.rest.issues.listComments({
        owner,
        repo,
        issue_number: issueNumber,
      });
      return data as GitHubComment[];
    } catch (error: any) {
      console.error(`Error fetching comments for issue #${issueNumber}:`, error.message);
      return [];
    }
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      
      if ('type' in data && data.type === 'file' && 'content' in data) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error: any) {
      console.error(`Error fetching file content for ${path}:`, error.message);
      return null;
    }
  }

  async searchCode(owner: string, repo: string, query: string): Promise<Array<{ path: string; html_url: string }>> {
    try {
      const { data } = await this.octokit.rest.search.code({
        q: `${query} repo:${owner}/${repo}`,
      });
      return data.items.map(item => ({
        path: item.path,
        html_url: item.html_url
      }));
    } catch (error: any) {
      console.error(`Error searching code for "${query}":`, error.message);
      return [];
    }
  }

  async gatherIssueContext(owner: string, repo: string, issue: GitHubIssue): Promise<IssueContext> {
    const comments = await this.getIssueComments(owner, repo, issue.number);
    
    // Extract keywords from issue title and body
    const keywords = this.extractKeywords(issue.title + ' ' + (issue.body || ''));
    
    const relatedFiles: FileContent[] = [];
    const codeReferences: CodeReference[] = [];
    
    // Search for code references
    for (const keyword of keywords.slice(0, 5)) { // Limit to first 5 keywords
      try {
        const searchResults = await this.searchCode(owner, repo, keyword);
        if (searchResults.length > 0) {
          codeReferences.push({
            keyword,
            matches: searchResults.slice(0, 3), // Limit to first 3 matches
          });
          
          // Get content of first related file
          if (searchResults.length > 0 && relatedFiles.length < 3) {
            const content = await this.getFileContent(owner, repo, searchResults[0].path);
            if (content) {
              relatedFiles.push({
                path: searchResults[0].path,
                content: content.slice(0, 2000), // Limit content size
              });
            }
          }
        }
      } catch (error) {
        console.error(`Error searching for keyword "${keyword}":`, error);
      }
    }

    return {
      issue: {
        number: issue.number,
        title: issue.title,
        body: issue.body || '',
        labels: issue.labels.map(label => label.name),
        state: issue.state,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      },
      comments,
      relatedFiles,
      codeReferences,
    };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - look for programming-related terms
    const keywords = text.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    const programmingKeywords = keywords.filter(keyword => 
      keyword.length > 3 && 
      !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'when', 'what', 'where'].includes(keyword.toLowerCase())
    );
    
    return [...new Set(programmingKeywords)]; // Remove duplicates
  }
}