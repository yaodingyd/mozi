import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { staticRouter } from './routes/static';
import { issuesRouter } from './routes/issues';
import { repositoriesRouter } from './routes/repositories';
import { refreshRouter } from './routes/refresh';
import { CronjobService } from './services/cronjob';

type Bindings = {
  DB: D1Database;
  GITHUB_TOKEN: string;
  ASSETS: Fetcher;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', cors());

// Routes
app.route('/', staticRouter);
app.route('/api/issues', issuesRouter);
app.route('/api/repositories', repositoriesRouter);
app.route('/api/refresh', refreshRouter);

// Worker handlers
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    const cronjobService = new CronjobService(env.GITHUB_TOKEN, env.DB);
    await cronjobService.runScheduledJob();
  }
};