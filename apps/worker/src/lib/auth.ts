// JWT verification using Supabase JWKS (ES256 asymmetric)
// Local verification via Web Crypto API — no extra network call per request
// (JWKS itself is fetched once per hour and cached)

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  exp: number;
  iat: number;
  aud: string;
  [key: string]: unknown;
}

const CACHE_DURATION = 3600_000; // 1 hour

let cachedJwk: JsonWebKey | null = null;
let cachedKid: string | null = null;
let cacheTimestamp = 0;

async function getJwk(jwksUrl: string, kid?: string): Promise<JsonWebKey> {
  const now = Date.now();
  if (cachedJwk && cachedKid === kid && now - cacheTimestamp < CACHE_DURATION) {
    return cachedJwk;
  }

  const res = await fetch(jwksUrl);
  if (!res.ok) throw new Error('Failed to fetch JWKS');

  const jwks = await res.json<{ keys: (JsonWebKey & { kid?: string })[] }>();
  if (!jwks.keys?.length) throw new Error('No keys in JWKS');

  // Match by kid if present, else take the first key
  const key = (kid && jwks.keys.find((k) => k.kid === kid)) || jwks.keys[0];

  cachedJwk = key;
  cachedKid = key.kid ?? null;
  cacheTimestamp = now;
  return key;
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

export async function verifyJwt(token: string, jwksUrl: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');

  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64)));

  if (header.alg !== 'ES256') {
    throw new Error(`Unsupported algorithm: ${header.alg}. Ask user to log out and log in again.`);
  }

  const jwk = await getJwk(jwksUrl, header.kid);

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  const valid = await crypto.subtle.verify('ECDSA', cryptoKey, signature, data);
  if (!valid) throw new Error('Invalid JWT signature');

  const payload: JwtPayload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(payloadB64)),
  );
  if (payload.exp * 1000 < Date.now()) throw new Error('JWT expired');

  return payload;
}
