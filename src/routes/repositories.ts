import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { repositories } from '../db/schema';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
};

export const repositoriesRouter = new Hono<{ Bindings: Bindings }>();

repositoriesRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const repos = await db.select().from(repositories);
  return c.json(repos);
});

repositoriesRouter.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const { owner, repo } = await c.req.json();
  
  const newRepo = await db.insert(repositories).values({
    owner,
    repo,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  
  return c.json(newRepo[0]);
});