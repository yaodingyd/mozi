import { useState, useEffect } from 'preact/hooks';
import { App } from './App';

interface Issue {
  issues: {
    id: number;
    repositoryId: number;
    issueNumber: number;
    title: string;
    body: string | null;
    state: string;
    labels: string | null;
    fixabilityScore: number | null;
    fixabilityLevel: string | null;
    recommendation: string | null;
    contextData: string | null;
  };
  repositories: {
    id: number;
    owner: string;
    repo: string;
    enabled: boolean;
  };
}

interface Repository {
  id: number;
  owner: string;
  repo: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AppContainerProps {
  initialIssues: Issue[];
  repositories: Repository[];
  loadData: (repositoryId?: string) => Promise<{ issues: Issue[]; repositories: Repository[] }>;
}

export function AppContainer({ initialIssues, repositories, loadData }: AppContainerProps) {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [selectedRepositoryId, setSelectedRepositoryId] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRepositoryChange = async (repositoryId: string) => {
    setSelectedRepositoryId(repositoryId);
    setIsLoading(true);

    try {
      const data = await loadData(repositoryId || undefined);
      setIssues(data.issues);
    } catch (error) {
      console.error('Failed to load issues for repository:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Call the refresh API
      const refreshResponse = await fetch('/api/refresh', { method: 'POST' });
      
      if (refreshResponse.ok) {
        // Reload issues after refresh
        const data = await loadData(selectedRepositoryId || undefined);
        setIssues(data.issues);
      } else {
        console.error('Refresh failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <App
      issues={issues}
      repositories={repositories}
      selectedRepositoryId={selectedRepositoryId}
      onRepositoryChange={handleRepositoryChange}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
      isLoading={isLoading}
    />
  );
}