import { Octokit } from '@octokit/rest';
import type { GitHubIssue, GitHubComment, RepositoryContent, SearchCodeResult } from './types.ts';
import dotenv from 'dotenv';

dotenv.config();

export class GitHubClient {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getIssues(owner: string, repo: string, options: any = {}): Promise<GitHubIssue[]> {
    try {
      const allIssues: GitHubIssue[] = [];
      let page = 1;
      const perPage = 100;

      while (true) {
        console.log(`📄 Fetching issues page ${page}...`);
        
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
          break; // No more issues
        }

        allIssues.push(...(data as GitHubIssue[]));
        console.log(`   Found ${data.length} issues (total: ${allIssues.length})`);
        
        // If we got fewer than perPage, we've reached the end
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

  async getRepositoryContent(owner: string, repo: string, path: string = ''): Promise<RepositoryContent | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      return data as RepositoryContent;
    } catch (error: any) {
      console.error(`Error fetching repository content at ${path}:`, error.message);
      return null;
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

  async searchCode(owner: string, repo: string, query: string): Promise<SearchCodeResult[]> {
    try {
      const { data } = await this.octokit.rest.search.code({
        q: `${query} repo:${owner}/${repo}`,
      });
      return data.items as SearchCodeResult[];
    } catch (error: any) {
      console.error(`Error searching code for "${query}":`, error.message);
      return [];
    }
  }
}