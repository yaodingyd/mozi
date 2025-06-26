export type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  labels: Array<{ name: string }>;
  state: string;
  created_at: string;
  updated_at: string;
};

export type GitHubComment = {
  body: string;
};

export interface FileContent {
  path: string;
  content: string;
}

export interface CodeReference {
  keyword: string;
  matches: Array<{
    path: string;
    url: string;
  }>;
}

export interface IssueContext {
  issue: {
    number: number;
    title: string;
    body: string;
    labels: string[];
    state: string;
    created_at: string;
    updated_at: string;
  };
  comments: GitHubComment[];
  relatedFiles: FileContent[];
  codeReferences: CodeReference[];
}

export interface FixabilityRule {
  name: string;
  weight: number;
  type: 'positive' | 'negative';
}

export interface FixabilityAnalysis {
  score: number;
  fixabilityLevel: 'High' | 'Medium' | 'Low' | 'Very Low';
  appliedRules: FixabilityRule[];
  recommendation: string;
}

export interface AnalyzedIssue {
  issue: IssueContext['issue'];
  analysis: FixabilityAnalysis;
  context: {
    relatedFilesCount: number;
    codeReferencesCount: number;
    commentsCount: number;
  };
}

export interface RepositoryInfo {
  owner: string;
  repo: string;
}

export interface SearchCodeResult {
  path: string;
  html_url: string;
}

export interface RepositoryContent {
  type: string;
  content?: string;
}