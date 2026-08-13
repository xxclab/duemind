import { SupabaseClient } from '../lib/supabase';
import { withAuth, jsonResponse, errorResponse, AuthenticatedRequest } from '../lib/helpers';

export async function handleChannelRoutes(request: AuthenticatedRequest, path: string, env: Env) {
  const db = new SupabaseClient(env);

  // GET /api/channels
  if (request.method === 'GET' && path === '/api/channels') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    try {
      const result = await db.getChannels(userId);
      if (result.error) return errorResponse(result.error.message, 500);
      return jsonResponse(result.data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  // POST /api/channels
  if (request.method === 'POST' && path === '/api/channels') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    const body = await request.json() as Record<string, unknown>;
    try {
      const result = await db.createChannel({ ...body, user_id: userId });
      if (result.error) return errorResponse(result.error.message, 500);
      return jsonResponse(result.data, 201);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  // PATCH /api/channels/:id
  if (request.method === 'PATCH' && path.startsWith('/api/channels/')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    const body = await request.json() as Record<string, unknown>;
    try {
      const result = await db.updateChannel(id, body);
      if (result.error) return errorResponse(result.error.message, 500);
      return jsonResponse(result.data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  // DELETE /api/channels/:id
  if (request.method === 'DELETE' && path.startsWith('/api/channels/')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    try {
      await db.deleteChannel(id);
      return jsonResponse({ deleted: true });
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  return null;
}
