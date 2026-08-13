// JWT verification using Supabase JWKS
// Uses the Web Crypto API available in Cloudflare Workers

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp: number;
  iat: number;
  aud: string;
  [key: string]: unknown;
}

const CACHE_DURATION = 3600_000; // 1 hour
let cachedKeys: JsonWebKey[] | null = null;
let cacheTimestamp = 0;

async function getJwks(jwksUrl: string): Promise<JsonWebKey[]> {
  const now = Date.now();
  if (cachedKeys && now - cacheTimestamp < CACHE_DURATION) {
    return cachedKeys;
  }

  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error('Failed to fetch JWKS');

  const jwks = await res.json<{ keys: JsonWebKey[] }>();
  if (!jwks.keys?.length) throw new Error('No keys in JWKS');

  cachedKeys = jwks.keys;
  cacheTimestamp = now;
  return cachedKeys;
}

function base64UrlDecode(str: string): Uint8Array {
  // Replace URL-safe characters
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '='
  while (base64.length % 4 !== 0) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function verifyJwt(token: string, jwksUrl: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const headerB64 = parts[0];
  const payloadB64 = parts[1];
  const signatureB64 = parts[2];

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));
  if (!header.alg || !header.kid) throw new Error('Missing alg or kid');

  // Verify algorithm
  if (header.alg !== 'RS256' && header.alg !== 'ES256') {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  const keys = await getJwks(jwksUrl);
  const key = keys.find(k => k.kid === header.kid);
  if (!key) throw new Error(`Key not found: ${header.kid}`);

  // Import the key for verification
  const algorithm: AlgorithmIdentifier = {
    name: header.alg === 'RS256' ? 'RSASSA-PKCS1-v1_5' : 'ECDSA',
    hash: 'SHA-256',
  };

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    algorithm,
    false,
    ['verify']
  );

  // Verify signature
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify(
    algorithm,
    cryptoKey,
    signature,
    data
  );

  if (!valid) throw new Error('Invalid JWT signature');

  // Check expiration
  const payload: JwtPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
  if (payload.exp * 1000 < Date.now()) throw new Error('JWT expired');

  return payload;
}
