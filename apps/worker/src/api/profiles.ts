import { SupabaseClient } from '../lib/supabase';
import { withAuth, jsonResponse, errorResponse, AuthenticatedRequest } from '../lib/helpers';

function firstRow<T>(data: T | null): T | null {
  if (Array.isArray(data)) return data.length > 0 ? data[0] : null;
  return data;
}

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
      const profile = firstRow(result.data);
      // If profile doesn't exist, create it (user registered before migration trigger)
      if (!profile) {
        const email = request.user!.email || `${userId}@users.noreply.duemind`;
        const created = await db.upsertProfile(userId, email);
        if (created.error) return errorResponse(created.error.message, 500);
        return jsonResponse(firstRow(created.data));
      }
      return jsonResponse(profile);
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
      const existing = await db.getProfile(userId);
      const profile = firstRow(existing.data);
      // No profile yet → upsert with email (NOT NULL) + fields in one shot
      if (!profile) {
        const email = request.user!.email || `${userId}@users.noreply.duemind`;
        const created = await db.upsertProfile(userId, email, body);
        if (created.error) return errorResponse(created.error.message, 500);
        return jsonResponse(firstRow(created.data));
      }
      const result = await db.updateProfile(userId, body);
      if (result.error) return errorResponse(result.error.message, 500);
      return jsonResponse(firstRow(result.data));
    } catch (e) {
      return errorResponse(e instanceof Error ? e.message : 'Unknown error', 500);
    }
  }

  return null;
}
