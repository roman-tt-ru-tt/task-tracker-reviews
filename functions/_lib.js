export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function makeToken(username) {
  const payload = { u: username, t: Date.now() };
  return btoa(JSON.stringify(payload));
}

export function parseToken(token) {
  try {
    return JSON.parse(atob(token));
  } catch {
    return null;
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function setCookie(name, value, maxAge = 60 * 60 * 24 * 30) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getCurrentUser(request, env) {
  const token = getCookie(request, 'session');
  if (!token) return null;
  const payload = parseToken(token);
  if (!payload || !payload.u) return null;
  const row = await env.DB.prepare(
    'SELECT id, username, is_admin FROM users WHERE username = ?'
  ).bind(payload.u).first();
  return row || null;
}

export async function requireAuth(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Не авторизован' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
