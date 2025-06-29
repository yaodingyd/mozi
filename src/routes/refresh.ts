import { Hono } from 'hono';
import { CronjobService } from '../services/cronjob';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
};

export const refreshRouter = new Hono<{ Bindings: Bindings }>();

refreshRouter.post('/', async (c) => {
  const cronjobService = new CronjobService(c.env.GITHUB_TOKEN, c.env.DB);
  
  try {
    const result = await cronjobService.processAllRepositories();
    return c.json({ 
      message: `Processed ${result.processedCount} issues from ${result.repositoryCount} repositories`,
      processedCount: result.processedCount,
      repositoryCount: result.repositoryCount
    });
  } catch (error) {
    console.error('Refresh failed:', error);
    return c.json({ error: 'Failed to refresh issues' }, 500);
  }
});