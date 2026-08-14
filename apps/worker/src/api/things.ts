import { SupabaseClient } from '../lib/supabase';
import { withAuth, jsonResponse, errorResponse, AuthenticatedRequest } from '../lib/helpers';

export async function handleThingsRoutes(request: AuthenticatedRequest, path: string, env: Env) {
  const db = new SupabaseClient(env);

  // GET /api/things - list user's things with optional filters
  if (request.method === 'GET' && path === '/api/things') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    const url = new URL(request.url);
    const filters: Record<string, string> = {};
    if (url.searchParams.get('status')) filters.status = url.searchParams.get('status')!;
    if (url.searchParams.get('category')) filters.category = url.searchParams.get('category')!;
    if (url.searchParams.get('due_before')) filters.due_before = url.searchParams.get('due_before')!;
    if (url.searchParams.get('due_after')) filters.due_after = url.searchParams.get('due_after')!;
    if (url.searchParams.get('search')) filters.search = url.searchParams.get('search')!;

    return handle(async () => {
      const result = await db.getThings(userId, filters);
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // POST /api/things - create a thing
  if (request.method === 'POST' && path === '/api/things') {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    const body = await request.json() as Record<string, unknown>;
    return handle(async () => {
      const thing = await db.createThing({
        ...body,
        user_id: userId,
      });
      if (thing.error) throw thing.error;

      // Create reminders if provided
      const reminders = body.reminders as Array<{ offset_minutes: number; channel_id: string }> | undefined;
      if (reminders?.length) {
        for (const r of reminders) {
          await db.createReminder({
            ...r,
            thing_id: thing.data!.id,
            user_id: userId,
          });
        }
      }

      return thing.data;
    });
  }

  // GET /api/things/:id - single thing with reminders
  if (request.method === 'GET' && path.startsWith('/api/things/') && !path.includes('/complete') && !path.includes('/dismiss')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    return handle(async () => {
      const result = await db.getThing(id);
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // PATCH /api/things/:id - update
  if (request.method === 'PATCH' && path.startsWith('/api/things/')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    const body = await request.json() as Record<string, unknown>;
    return handle(async () => {
      const result = await db.updateThing(id, body);
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // DELETE /api/things/:id
  if (request.method === 'DELETE' && path.startsWith('/api/things/')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    return handle(async () => {
      await db.deleteThing(id);
      return { deleted: true };
    });
  }

  // POST /api/things/:id/complete
  if (request.method === 'POST' && path.includes('/complete')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    return handle(async () => {
      const result = await db.updateThing(id, {
        status: 'done',
        completed_at: new Date().toISOString(),
      });
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // POST /api/things/:id/dismiss
  if (request.method === 'POST' && path.includes('/dismiss')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const id = path.split('/')[3];
    return handle(async () => {
      const result = await db.updateThing(id, { status: 'dismissed' });
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // POST /api/things/:id/reminders
  if (request.method === 'POST' && path.includes('/reminders')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const userId = request.user!.sub;
    const thingId = path.split('/')[3];
    const body = await request.json() as { offset_minutes: number; channel_id: string };
    return handle(async () => {
      const result = await db.createReminder({
        ...body,
        thing_id: thingId,
        user_id: userId,
      });
      if (result.error) throw result.error;
      return result.data;
    });
  }

  // DELETE /api/things/:id/reminders/:reminderId
  if (request.method === 'DELETE' && path.includes('/reminders/')) {
    if (!(await withAuth(request, env))) {
      return errorResponse('Unauthorized', 401);
    }
    const reminderId = path.split('/')[5];
    return handle(async () => {
      await db.deleteReminder(reminderId);
      return { deleted: true };
    });
  }

  return null;
}

async function handle(fn: () => Promise<unknown>) {
  try {
    const data = await fn();
    return jsonResponse(data);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : ((e as { message?: string })?.message ?? 'Unknown error');
    return errorResponse(message, 500);
  }
}
