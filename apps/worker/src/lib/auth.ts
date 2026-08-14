// JWT verification for Supabase Auth
// Supports both HS256 (legacy symmetric) and ES256 (asymmetric via JWKS)

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
let cachedKey: JsonWebKey | null = null;
let cacheTimestamp = 0;

async function getJwk(jwksUrl: string): Promise<JsonWebKey> {
  const now = Date.now();
  if (cachedKey && now - cacheTimestamp < CACHE_DURATION) {
    return cachedKey;
  }

  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error('Failed to fetch JWKS');

  const jwks = await res.json<{ keys: JsonWebKey[] }>();
  if (!jwks.keys?.length) throw new Error('No keys in JWKS');

  cachedKey = jwks.keys[0];
  cacheTimestamp = now;
  return cachedKey;
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function verifyEs256(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  jwksUrl: string,
): Promise<JwtPayload> {
  const key = await getJwk(jwksUrl);

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'ECDSA', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify('ECDSA', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid JWT signature');

  return JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
}

async function verifyHs256(
  headerB64: string,
  payloadB64: string,
  signatureB64: string,
  jwtSecret: string,
): Promise<JwtPayload> {
  const keyData = new TextEncoder().encode(jwtSecret);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify('HMAC', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid JWT signature');

  return JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
}

export async function verifyJwt(
  token: string,
  jwksUrl: string,
  jwtSecret?: string,
): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));

  let payload: JwtPayload;

  if (header.alg === 'ES256') {
    payload = await verifyEs256(headerB64, payloadB64, signatureB64, jwksUrl);
  } else if (header.alg === 'HS256') {
    if (!jwtSecret) throw new Error('HS256 token but no JWT_SECRET configured');
    payload = await verifyHs256(headerB64, payloadB64, signatureB64, jwtSecret);
  } else {
    throw new Error(`Unsupported algorithm: ${header.alg}`);
  }

  if (payload.exp * 1000 < Date.now()) throw new Error('JWT expired');
  return payload;
}
