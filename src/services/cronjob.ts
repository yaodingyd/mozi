import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { repositories, issues } from '../db/schema';
import { GitHubService } from './github';
import { IssueAnalysisService } from './analysis';

export class CronjobService {
  private githubService: GitHubService;
  private analysisService: IssueAnalysisService;
  private db: ReturnType<typeof drizzle>;

  constructor(githubToken: string, database: D1Database) {
    this.githubService = new GitHubService(githubToken);
    this.analysisService = new IssueAnalysisService();
    this.db = drizzle(database);
  }

  async processAllRepositories(): Promise<{ processedCount: number; repositoryCount: number }> {
    const repos = await this.db.select().from(repositories).where(eq(repositories.enabled, true));
    let processedCount = 0;

    for (const repo of repos) {
      try {
        const repoProcessedCount = await this.processRepository(repo);
        processedCount += repoProcessedCount;
        console.log(`Processed ${repoProcessedCount} issues from ${repo.owner}/${repo.repo}`);
      } catch (error) {
        console.error(`Error processing repo ${repo.owner}/${repo.repo}:`, error);
      }
    }

    return { processedCount, repositoryCount: repos.length };
  }

  private async processRepository(repo: any): Promise<number> {
    const githubIssues = await this.githubService.getIssues(repo.owner, repo.repo);
    let processedCount = 0;

    for (const githubIssue of githubIssues) {
      try {
        const context = await this.githubService.gatherIssueContext(repo.owner, repo.repo, githubIssue);
        const analysis = this.analysisService.analyzeFixability(context);

        await this.saveIssueAnalysis(repo, githubIssue, analysis, context);
        processedCount++;
      } catch (error) {
        console.error(`Error processing issue #${githubIssue.number}:`, error);
      }
    }

    return processedCount;
  }

  private async saveIssueAnalysis(repo: any, githubIssue: any, analysis: any, context: any): Promise<void> {
    await this.db.insert(issues).values({
      repositoryId: repo.id,
      issueNumber: githubIssue.number,
      title: githubIssue.title,
      body: githubIssue.body || '',
      state: githubIssue.state,
      labels: JSON.stringify(githubIssue.labels),
      createdAt: new Date(githubIssue.created_at),
      updatedAt: new Date(githubIssue.updated_at),
      analyzedAt: new Date(),
      fixabilityScore: analysis.score,
      fixabilityLevel: analysis.fixabilityLevel,
      appliedRules: JSON.stringify(analysis.appliedRules),
      recommendation: analysis.recommendation,
      contextData: JSON.stringify({
        relatedFilesCount: context.relatedFiles.length,
        codeReferencesCount: context.codeReferences.length,
        commentsCount: context.comments.length,
      }),
    });
  }

  async runScheduledJob(): Promise<void> {
    console.log('Starting scheduled issue analysis...');
    const startTime = Date.now();
    
    try {
      const result = await this.processAllRepositories();
      const duration = Date.now() - startTime;
      
      console.log(`Scheduled job completed: ${result.processedCount} issues processed from ${result.repositoryCount} repositories in ${duration}ms`);
    } catch (error) {
      console.error('Scheduled job failed:', error);
    }
  }
}