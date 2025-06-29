
interface Repository {
  id: number;
  owner: string;
  repo: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RepositoryManagerProps {
  repositories: Repository[];
}

export function RepositoryManager({ repositories }: RepositoryManagerProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h3>📁 Repository Settings</h3>
      
      <div style={{ marginBottom: '1rem' }}>
        <form 
          style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }} 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const owner = formData.get('owner') as string;
            const repo = formData.get('repo') as string;
            
            try {
              await fetch('/api/repositories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner, repo })
              });
              location.reload();
            } catch (err) {
              console.error('Failed to add repository:', err);
            }
          }}
        >
          <input 
            type="text" 
            name="owner" 
            placeholder="owner" 
            required 
            style={{ padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: '4px' }}
          />
          <span>/</span>
          <input 
            type="text" 
            name="repo" 
            placeholder="repo" 
            required 
            style={{ padding: '0.5rem', border: '1px solid #e1e4e8', borderRadius: '4px' }}
          />
          <button 
            type="submit" 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Add Repository
          </button>
        </form>
      </div>

      {repositories.length > 0 && (
        <div>
          <h4>Current Repositories:</h4>
          {repositories.map((repo) => (
            <div 
              key={repo.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.5rem', 
                border: '1px solid #e1e4e8', 
                borderRadius: '4px', 
                marginBottom: '0.5rem' 
              }}
            >
              <span>
                <strong>{repo.owner}/{repo.repo}</strong>
                {!repo.enabled && <span style={{ color: '#dc3545', marginLeft: '0.5rem' }}>(disabled)</span>}
              </span>
              <div>
                <button 
                  style={{ 
                    padding: '0.25rem 0.5rem', 
                    fontSize: '0.75rem', 
                    backgroundColor: repo.enabled ? '#dc3545' : '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: 'pointer' 
                  }}
                >
                  {repo.enabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}