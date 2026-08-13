import { verifyJwt } from '../lib/auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email?: string;
    role?: string;
  };
}

export async function withAuth(request: AuthenticatedRequest, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyJwt(token, env.SUPABASE_JWKS_URL);
    (request as AuthenticatedRequest).user = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return true;
  } catch {
    return false;
  }
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}
