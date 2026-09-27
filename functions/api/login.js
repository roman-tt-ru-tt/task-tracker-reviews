import { hashPassword, makeToken, setCookie, jsonResponse } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return jsonResponse({ error: 'Заполни все поля' }, 400);
    }

    const row = await env.DB.prepare(
      'SELECT id, username, password_hash, is_admin FROM users WHERE username = ?'
    ).bind(username).first();

    if (!row) {
      return jsonResponse({ error: 'Неверный ник или пароль' }, 400);
    }

    const [salt, expected] = row.password_hash.split(':');
    const got = await hashPassword(password, salt);
    if (got !== expected) {
      return jsonResponse({ error: 'Неверный ник или пароль' }, 400);
    }

    const token = makeToken(username);
    return new Response(JSON.stringify({ ok: true, username, is_admin: row.is_admin === 1 }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookie('session', token),
      },
    });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
}
