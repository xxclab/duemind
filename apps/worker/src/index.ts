import { handleThingsRoutes } from './api/things';
import { handleChannelRoutes } from './api/channels';
import { handleProfileRoutes } from './api/profiles';
import { runCron } from './cron';

export { Env } from './types';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // API routes
    if (path.startsWith('/api/things')) {
      const result = await handleThingsRoutes(request, path, env);
      if (result) return result;
    }

    if (path.startsWith('/api/channels')) {
      const result = await handleChannelRoutes(request, path, env);
      if (result) return result;
    }

    if (path.startsWith('/api/profile')) {
      const result = await handleProfileRoutes(request, path, env);
      if (result) return result;
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCron(env));
  },
};
