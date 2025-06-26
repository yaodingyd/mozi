
import type { IssueContext, FixabilityAnalysis, FixabilityRule } from './types.ts';

interface AnalysisRule {
  name: string;
  weight: number;
  check: (context: IssueContext) => boolean;
}

export class IssueAnalyzer {
  private fixabilityRules: AnalysisRule[];
  private negativeCriteria: AnalysisRule[];

  constructor() {
    this.fixabilityRules = [
      {
        name: 'Bug Report with Stack Trace',
        weight: 0.9,
        check: (context) => this.hasBugIndicators(context) && this.hasStackTrace(context),
      },
      {
        name: 'File Reference with Error Message',
        weight: 0.8,
        check: (context) => context.relatedFiles.length > 0 && this.hasErrorMessage(context),
      },
      {
        name: 'Simple Bug Label',
        weight: 0.7,
        check: (context) => this.hasBugLabel(context),
      },
      {
        name: 'Code References Available',
        weight: 0.6,
        check: (context) => context.codeReferences.length > 0,
      },
      {
        name: 'Specific Function/Method Mentioned',
        weight: 0.5,
        check: (context) => this.mentionsFunctionOrMethod(context),
      },
      {
        name: 'Enhancement with Clear Requirements',
        weight: 0.4,
        check: (context) => this.hasEnhancementLabel(context) && this.hasClearRequirements(context),
      },
    ];

    this.negativeCriteria = [
      {
        name: 'Feature Request without Context',
        weight: -0.5,
        check: (context) => this.isFeatureRequest(context) && !this.hasClearRequirements(context),
      },
      {
        name: 'Question or Discussion',
        weight: -0.6,
        check: (context) => this.isQuestionOrDiscussion(context),
      },
      {
        name: 'External Dependency Issue',
        weight: -0.4,
        check: (context) => this.hasExternalDependencyIssue(context),
      },
      {
        name: 'Duplicate Issue',
        weight: -0.8,
        check: (context) => this.isDuplicate(context),
      },
    ];
  }

  analyzeFixability(context: IssueContext): FixabilityAnalysis {
    let score = 0;
    const appliedRules: FixabilityRule[] = [];

    for (const rule of this.fixabilityRules) {
      if (rule.check(context)) {
        score += rule.weight;
        appliedRules.push({ name: rule.name, weight: rule.weight, type: 'positive' });
      }
    }

    for (const rule of this.negativeCriteria) {
      if (rule.check(context)) {
        score += rule.weight;
        appliedRules.push({ name: rule.name, weight: rule.weight, type: 'negative' });
      }
    }

    score = Math.max(0, Math.min(1, score));

    const fixabilityLevel = this.getFixabilityLevel(score);

    return {
      score,
      fixabilityLevel,
      appliedRules,
      recommendation: this.getRecommendation(score, context),
    };
  }

  private hasBugIndicators(context: IssueContext): boolean {
    const bugKeywords = ['error', 'bug', 'crash', 'exception', 'fail', 'broken', 'issue', 'problem'];
    const text = (context.issue.title + ' ' + context.issue.body).toLowerCase();
    return bugKeywords.some(keyword => text.includes(keyword));
  }

  private hasStackTrace(context: IssueContext): boolean {
    const stackTracePatterns = [
      /at\s+\w+.*:\d+:\d+/,
      /File\s+".*",\s+line\s+\d+/,
      /^\s*at\s+.*\(.*:\d+:\d+\)$/m,
      /Traceback|Exception|Error:/,
    ];
    const text = context.issue.body + ' ' + context.comments.map(c => c.body).join(' ');
    return stackTracePatterns.some(pattern => pattern.test(text));
  }

  private hasErrorMessage(context: IssueContext): boolean {
    const errorPatterns = [
      /Error:\s*.+/,
      /Exception:\s*.+/,
      /Failed:\s*.+/,
      /TypeError|ReferenceError|SyntaxError/,
    ];
    const text = context.issue.body + ' ' + context.comments.map(c => c.body).join(' ');
    return errorPatterns.some(pattern => pattern.test(text));
  }

  private hasBugLabel(context: IssueContext): boolean {
    const bugLabels = ['bug', 'error', 'defect', 'issue', 'crash'];
    return context.issue.labels.some(label => 
      bugLabels.some(bugLabel => label.toLowerCase().includes(bugLabel))
    );
  }

  private mentionsFunctionOrMethod(context: IssueContext): boolean {
    const functionPatterns = [
      /function\s+\w+/gi,
      /\w+\(\)/g,
      /method\s+\w+/gi,
      /\w+\.\w+\(/g,
    ];
    const text = context.issue.title + ' ' + context.issue.body;
    return functionPatterns.some(pattern => pattern.test(text));
  }

  private hasEnhancementLabel(context: IssueContext): boolean {
    const enhancementLabels = ['enhancement', 'feature', 'improvement'];
    return context.issue.labels.some(label => 
      enhancementLabels.some(enhLabel => label.toLowerCase().includes(enhLabel))
    );
  }

  private hasClearRequirements(context: IssueContext): boolean {
    const requirementIndicators = [
      /should|must|need|want|require/i,
      /step.*\d/i,
      /expected.*behavior/i,
      /\d+\./,
    ];
    const text = context.issue.body;
    return requirementIndicators.some(pattern => pattern.test(text)) && text.length > 100;
  }

  private isFeatureRequest(context: IssueContext): boolean {
    const featureKeywords = ['feature', 'add', 'implement', 'support', 'enhancement'];
    const text = (context.issue.title + ' ' + context.issue.body).toLowerCase();
    return featureKeywords.some(keyword => text.includes(keyword));
  }

  private isQuestionOrDiscussion(context: IssueContext): boolean {
    const questionKeywords = ['how', 'why', 'what', 'question', 'help', 'discussion'];
    const text = context.issue.title.toLowerCase();
    return questionKeywords.some(keyword => text.includes(keyword)) || text.includes('?');
  }

  private hasExternalDependencyIssue(context: IssueContext): boolean {
    const dependencyKeywords = ['npm', 'yarn', 'package', 'dependency', 'third-party', 'external'];
    const text = (context.issue.title + ' ' + context.issue.body).toLowerCase();
    return dependencyKeywords.some(keyword => text.includes(keyword));
  }

  private isDuplicate(context: IssueContext): boolean {
    const duplicateKeywords = ['duplicate', 'already', 'existing'];
    const text = context.comments.map(c => c.body).join(' ').toLowerCase();
    return duplicateKeywords.some(keyword => text.includes(keyword));
  }

  private getFixabilityLevel(score: number): 'High' | 'Medium' | 'Low' | 'Very Low' {
    if (score >= 0.7) return 'High';
    if (score >= 0.4) return 'Medium';
    if (score >= 0.2) return 'Low';
    return 'Very Low';
  }

  private getRecommendation(score: number, context: IssueContext): string {
    if (score >= 0.7) {
      return 'This issue appears highly fixable with clear context and actionable information.';
    }
    if (score >= 0.4) {
      return 'This issue is moderately fixable but may need additional context or investigation.';
    }
    if (score >= 0.2) {
      return 'This issue has low fixability - consider asking for more details or reproduction steps.';
    }
    return 'This issue appears difficult to fix without significant additional information.';
  }
}