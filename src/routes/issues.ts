import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, desc, and } from 'drizzle-orm';
import { repositories, issues } from '../db/schema';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
};

export const issuesRouter = new Hono<{ Bindings: Bindings }>();

issuesRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const repositoryId = c.req.query('repositoryId');
  
  // Build WHERE conditions
  const whereConditions = [eq(repositories.enabled, true)];
  if (repositoryId) {
    whereConditions.push(eq(issues.repositoryId, parseInt(repositoryId)));
  }
  
  const allIssues = await db
    .select()
    .from(issues)
    .innerJoin(repositories, eq(issues.repositoryId, repositories.id))
    .where(and(...whereConditions))
    .orderBy(desc(issues.fixabilityScore));
  
  return c.json(allIssues);
});