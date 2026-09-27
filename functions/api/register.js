import { hashPassword, makeToken, setCookie, jsonResponse } from '../_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return jsonResponse({ error: 'Заполни все поля' }, 400);
    }
    if (username.length < 3 || username.length > 30) {
      return jsonResponse({ error: 'Ник 3–30 символов' }, 400);
    }
    if (password.length < 6) {
      return jsonResponse({ error: 'Пароль минимум 6 символов' }, 400);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE username = ?'
    ).bind(username).first();
    if (existing) {
      return jsonResponse({ error: 'Ник уже занят' }, 400);
    }

    const salt = crypto.randomUUID();
    const hash = await hashPassword(password, salt);
    const stored = salt + ':' + hash;

    await env.DB.prepare(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)'
    ).bind(username, stored).run();

    const token = makeToken(username);
    return new Response(JSON.stringify({ ok: true, username }), {
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
