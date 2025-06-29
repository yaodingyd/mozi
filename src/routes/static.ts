import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
};

export const staticRouter = new Hono<{ Bindings: Bindings }>();

staticRouter.get('/*', async (c, next) => {
  const url = new URL(c.req.url);
  
  // If requesting API routes, continue to next handler
  if (url.pathname.startsWith('/api')) {
    return next();
  }
  
  // Try to serve from static assets first
  try {
    const response = await c.env.ASSETS.fetch(c.req.url);
    if (response.status === 200) {
      return response;
    }
  } catch (error) {
    console.log('Asset not found, serving index.html');
  }
  
  // For SPA routes, serve index.html
  try {
    const indexResponse = await c.env.ASSETS.fetch(new URL('/index.html', c.req.url));
    return indexResponse;
  } catch (error) {
    return c.text('Static assets not found', 404);
  }
});