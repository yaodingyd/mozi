import { RepositoryManager } from './RepositoryManager';

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

interface AppProps {
  issues: Issue[];
  repositories: Repository[];
  selectedRepositoryId: string;
  onRepositoryChange: (repositoryId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading: boolean;
}

export function App({ 
  issues, 
  repositories, 
  selectedRepositoryId, 
  onRepositoryChange, 
  onRefresh, 
  isRefreshing, 
  isLoading 
}: AppProps) {
  const getFixabilityBadgeClass = (level: string | null) => {
    switch (level) {
      case 'High': return 'fixability-badge fixability-high';
      case 'Medium': return 'fixability-badge fixability-medium';
      case 'Low': return 'fixability-badge fixability-low';
      case 'Very Low': return 'fixability-badge fixability-very-low';
      default: return 'fixability-badge';
    }
  };

  const getEmoji = (level: string | null) => {
    switch (level) {
      case 'High': return '🟢';
      case 'Medium': return '🟡';
      case 'Low': return '🟠';
      case 'Very Low': return '🔴';
      default: return '⚪';
    }
  };

  const formatScore = (score: number | null) => {
    return score ? (score * 100).toFixed(1) + '%' : 'N/A';
  };

  const parseLabels = (labelsStr: string | null) => {
    if (!labelsStr) return [];
    try {
      return JSON.parse(labelsStr);
    } catch {
      return [];
    }
  };

  return (
    <div>
      <RepositoryManager repositories={repositories} />
      
      <div style={{ marginBottom: '2rem' }}>
        <h3>🔍 Filter by Repository</h3>
        <select 
          value={selectedRepositoryId} 
          onChange={(e) => onRepositoryChange((e.target as HTMLSelectElement).value)}
          style={{ 
            padding: '0.5rem', 
            border: '1px solid #e1e4e8', 
            borderRadius: '4px', 
            marginRight: '1rem',
            minWidth: '200px'
          }}
        >
          <option value="">All repositories</option>
          {repositories.map((repo) => (
            <option key={repo.id} value={repo.id.toString()}>
              {repo.owner}/{repo.repo}
            </option>
          ))}
        </select>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Fixable Issues ({issues.length})</h2>
        <button 
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{ 
            opacity: isRefreshing ? 0.6 : 1,
            cursor: isRefreshing ? 'not-allowed' : 'pointer'
          }}
        >
          {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh Issues'}
        </button>
      </div>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#586069' }}>
          <div>⏳ Loading issues...</div>
        </div>
      )}

      {!isLoading && issues.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#586069' }}>
          <h3>No issues found</h3>
          <p>{selectedRepositoryId ? 'No issues found for this repository.' : 'Add some repositories or refresh to see issues.'}</p>
        </div>
      )}

      {!isLoading && issues.map((item) => {
        const labels = parseLabels(item.issues.labels);
        const contextData = item.issues.contextData ? JSON.parse(item.issues.contextData) : {};
        
        return (
          <div key={`${item.issues.repositoryId}-${item.issues.issueNumber}`} className="issue-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <a 
                href={`https://github.com/${item.repositories.owner}/${item.repositories.repo}/issues/${item.issues.issueNumber}`}
                className="issue-title"
                target="_blank"
                rel="noopener noreferrer"
              >
                #{item.issues.issueNumber}: {item.issues.title}
              </a>
              <span className={getFixabilityBadgeClass(item.issues.fixabilityLevel)}>
                {getEmoji(item.issues.fixabilityLevel)} {item.issues.fixabilityLevel || 'Unknown'}
              </span>
            </div>
            
            <div className="issue-meta">
              <strong>{item.repositories.owner}/{item.repositories.repo}</strong> • 
              Score: {formatScore(item.issues.fixabilityScore)} • 
              Context: {contextData.relatedFilesCount || 0} files, {contextData.codeReferencesCount || 0} code refs, {contextData.commentsCount || 0} comments
            </div>

            {labels.length > 0 && (
              <div style={{ margin: '0.5rem 0' }}>
                {labels.map((label: any) => (
                  <span 
                    key={label.name} 
                    style={{ 
                      display: 'inline-block', 
                      padding: '0.125rem 0.5rem', 
                      fontSize: '0.75rem', 
                      backgroundColor: `#${label.color || 'e1e4e8'}`, 
                      color: label.color && parseInt(label.color, 16) > 0x7FFFFF ? '#000' : '#fff',
                      borderRadius: '12px', 
                      marginRight: '0.25rem' 
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {item.issues.recommendation && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f6f8fa', borderRadius: '4px', fontSize: '0.875rem' }}>
                💡 {item.issues.recommendation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}