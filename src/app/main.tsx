import { render } from 'preact';
import { AppContainer } from './components/AppContainer';

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

interface AppData {
  issues: Issue[];
  repositories: Repository[];
}

async function loadData(repositoryId?: string): Promise<AppData> {
  try {
    const issuesUrl = repositoryId ? `/api/issues?repositoryId=${repositoryId}` : '/api/issues';
    const [issuesResponse, repositoriesResponse] = await Promise.all([
      fetch(issuesUrl),
      fetch('/api/repositories')
    ]);

    const issues = await issuesResponse.json();
    const repositories = await repositoriesResponse.json();

    return { issues, repositories };
  } catch (error) {
    console.error('Failed to load data:', error);
    return { issues: [], repositories: [] };
  }
}

async function initApp() {
  const appElement = document.getElementById('app');
  if (!appElement) {
    console.error('App element not found');
    return;
  }

  // Show loading state
  appElement.innerHTML = '<div style="text-align: center; padding: 2rem;">Loading...</div>';

  try {
    const data = await loadData();
    render(<AppContainer initialIssues={data.issues} repositories={data.repositories} loadData={loadData} />, appElement);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    appElement.innerHTML = '<div style="text-align: center; padding: 2rem; color: red;">Failed to load application</div>';
  }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}