import { GitHubClient } from './github-client.ts';
import { ContextGatherer } from './context-gatherer.ts';
import { IssueAnalyzer } from './issue-analyzer.ts';
import type { AnalyzedIssue, RepositoryInfo } from './types.ts';
import { writeFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

class MoziAnalyzer {
  private githubClient: GitHubClient;
  private contextGatherer: ContextGatherer;
  private issueAnalyzer: IssueAnalyzer;
  private logBuffer: string[] = [];

  constructor() {
    this.githubClient = new GitHubClient();
    this.contextGatherer = new ContextGatherer(this.githubClient);
    this.issueAnalyzer = new IssueAnalyzer();
  }

  private log(message: string): void {
    this.logBuffer.push(message);
    console.log(message);
  }

  async analyzeRepository(repoUrl: string, topRecommendedCount: number = 10): Promise<void> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    this.log(`🔍 Analyzing repository: ${owner}/${repo}`);
    this.log('━'.repeat(50));

    try {
      const issues = await this.githubClient.getIssues(owner, repo);
      this.log(`📋 Found ${issues.length} open issues`);

      const analyzedIssues: AnalyzedIssue[] = [];

      for (let i = 0; i < issues.length; i++) {
        const issue = issues[i];
        this.log(`\n🔄 Analyzing issue #${issue.number}: ${issue.title}`);
        
        const context = await this.contextGatherer.gatherIssueContext(owner, repo, issue);
        const analysis = this.issueAnalyzer.analyzeFixability(context);
        
        analyzedIssues.push({
          issue: context.issue,
          analysis,
          context: {
            relatedFilesCount: context.relatedFiles.length,
            codeReferencesCount: context.codeReferences.length,
            commentsCount: context.comments.length,
          },
        });

        this.log(`   ✓ Fixability: ${analysis.fixabilityLevel} (${(analysis.score * 100).toFixed(1)}%)`);
      }

      this.outputResults(analyzedIssues, owner, repo, topRecommendedCount);
      this.saveResultsToFile(owner, repo);

    } catch (error: any) {
      console.error('❌ Error analyzing repository:', error.message);
    }
  }

  parseRepoUrl(repoUrl: string): RepositoryInfo {
    if (repoUrl.includes('github.com')) {
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        return { owner: match[1], repo: match[2].replace('.git', '') };
      }
    } else if (repoUrl.includes('/')) {
      const [owner, repo] = repoUrl.split('/');
      return { owner, repo };
    }
    
    throw new Error('Invalid repository URL format. Use: owner/repo or full GitHub URL');
  }

  private saveResultsToFile(owner: string, repo: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mozi-analysis-${owner}-${repo}-${timestamp}.txt`;
    const filepath = join(process.cwd(), filename);
    
    const content = this.logBuffer.join('\n');
    writeFileSync(filepath, content, 'utf-8');
    
    console.log(`\n📄 Full analysis saved to: ${filename}`);
  }

  outputResults(analyzedIssues: AnalyzedIssue[], owner: string, repo: string, topRecommendedCount: number = 10): void {
    this.log('\n' + '='.repeat(70));
    this.log(`📊 FIXABILITY ANALYSIS RESULTS - ${owner}/${repo}`);
    this.log('='.repeat(70));

    const sortedIssues = analyzedIssues.sort((a, b) => b.analysis.score - a.analysis.score);

    const grouped = {
      'High': sortedIssues.filter(item => item.analysis.fixabilityLevel === 'High'),
      'Medium': sortedIssues.filter(item => item.analysis.fixabilityLevel === 'Medium'),
      'Low': sortedIssues.filter(item => item.analysis.fixabilityLevel === 'Low'),
      'Very Low': sortedIssues.filter(item => item.analysis.fixabilityLevel === 'Very Low'),
    };

    this.log('\n📈 SUMMARY:');
    Object.entries(grouped).forEach(([level, issues]) => {
      if (issues.length > 0) {
        this.log(`   ${this.getEmoji(level)} ${level}: ${issues.length} issues`);
      }
    });

    Object.entries(grouped).forEach(([level, issues]) => {
      if (issues.length > 0) {
        this.log(`\n${this.getEmoji(level)} ${level.toUpperCase()} FIXABILITY ISSUES:`);
        this.log('─'.repeat(50));
        
        issues.forEach((item, index) => {
          this.log(`\n${index + 1}. Issue #${item.issue.number}: ${item.issue.title}`);
          this.log(`   Score: ${(item.analysis.score * 100).toFixed(1)}%`);
          this.log(`   Context: ${item.context.relatedFilesCount} files, ${item.context.codeReferencesCount} code refs, ${item.context.commentsCount} comments`);
          this.log(`   Recommendation: ${item.analysis.recommendation}`);
          
          if (item.analysis.appliedRules.length > 0) {
            this.log(`   Applied Rules:`);
            item.analysis.appliedRules.forEach(rule => {
              const sign = rule.type === 'positive' ? '+' : '-';
              this.log(`     ${sign} ${rule.name} (${rule.weight})`);
            });
          }
          
          this.log(`   🔗 https://github.com/${owner}/${repo}/issues/${item.issue.number}`);
        });
      }
    });

    const topFixable = sortedIssues.slice(0, topRecommendedCount).filter(item => item.analysis.score >= 0.4);
    if (topFixable.length > 0) {
      this.log(`\n🎯 TOP ${topRecommendedCount} RECOMMENDED FIXES:`);
      this.log('─'.repeat(30));
      topFixable.forEach((item, index) => {
        this.log(`${index + 1}. #${item.issue.number}: ${item.issue.title} (${(item.analysis.score * 100).toFixed(1)}%)`);
      });
    }

    this.log('\n✅ Analysis complete!');
  }

  getEmoji(level: string): string {
    const emojis: Record<string, string> = {
      'High': '🟢',
      'Medium': '🟡',
      'Low': '🟠',
      'Very Low': '🔴',
    };
    return emojis[level] || '⚪';
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: pnpm start <repository-url> [top-recommended-count]');
    console.log('Example: pnpm start owner/repo');
    console.log('Example: pnpm start owner/repo 15');
    console.log('Example: pnpm start https://github.com/owner/repo 20');
    console.log('Default top-recommended-count: 10');
    process.exit(1);
  }

  if (!process.env.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN environment variable is required');
    console.log('1. Create a .env file based on .env.example');
    console.log('2. Add your GitHub personal access token');
    process.exit(1);
  }

  const repoUrl = args[0];
  const topRecommendedCount = args[1] ? parseInt(args[1], 10) : 10;
  
  if (args[1] && (isNaN(topRecommendedCount) || topRecommendedCount <= 0)) {
    console.error('❌ Top recommended count must be a positive number');
    process.exit(1);
  }
  
  const analyzer = new MoziAnalyzer();
  
  await analyzer.analyzeRepository(repoUrl, topRecommendedCount);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}