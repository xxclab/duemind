import { SupabaseClient } from '../lib/supabase';
import { withAuth, jsonResponse, errorResponse, AuthenticatedRequest } from '../lib/helpers';

export async function handleProfileRoutes(request: AuthenticatedRequest, path: string, env: Env) {
  const db = new SupabaseClient(env);

  // GET /api/profile
  if (request.method === 'GET' && path === '/api/profile') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    try {
      const result = await db.getProfile(userId);
      if (result.error) return errorResponse(result.error.message, 500);
      // If profile doesn't exist, create it
      if (!result.data) {
        const created = await db.createProfileDirect(userId);
        if (created.error) return errorResponse(created.error.message, 500);
        return jsonResponse(created.data);
      }
      return jsonResponse(result.data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  // PATCH /api/profile
  if (request.method === 'PATCH' && path === '/api/profile') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    const body = await request.json() as Record<string, unknown>;
    try {
      const result = await db.updateProfile(userId, body);
      if (result.error) return errorResponse(result.error.message, 500);
      return jsonResponse(result.data);
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  return null;
}
