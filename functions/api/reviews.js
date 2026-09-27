import { requireAuth, jsonResponse } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sort = url.searchParams.get('sort') || 'new';
    const q = (url.searchParams.get('q') || '').trim();

    let sql = `
      SELECT r.id, r.rating, r.title, r.body, r.created_at, u.username
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'approved'
    `;
    const params = [];

    if (q) {
      sql += ` AND (r.title LIKE ? OR r.body LIKE ? OR u.username LIKE ?)`;
      const like = '%' + q + '%';
      params.push(like, like, like);
    }

    if (sort === 'top') {
      sql += ` ORDER BY r.rating DESC, r.created_at DESC`;
    } else {
      sql += ` ORDER BY r.created_at DESC`;
    }

    sql += ` LIMIT 100`;

    const stmt = env.DB.prepare(sql);
    const res = params.length ? await stmt.bind(...params).all() : await stmt.all();

    return jsonResponse({ reviews: res.results || [] });
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireAuth(request, env);
    const { rating, title, body } = await request.json();

    const r = parseInt(rating, 10);
    if (!r || r < 1 || r > 5) {
      return jsonResponse({ error: 'Оценка 1–5' }, 400);
    }
    if (!title || title.trim().length < 3 || title.trim().length > 100) {
      return jsonResponse({ error: 'Заголовок 3–100 символов' }, 400);
    }
    if (!body || body.trim().length < 10 || body.trim().length > 2000) {
      return jsonResponse({ error: 'Текст 10–2000 символов' }, 400);
    }

    await env.DB.prepare(
      `INSERT INTO reviews (user_id, rating, title, body, status)
       VALUES (?, ?, ?, ?, 'pending')`
    ).bind(user.id, r, title.trim(), body.trim()).run();

    return jsonResponse({ ok: true, message: 'Отзыв отправлен на модерацию' });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonResponse({ error: String(e) }, 500);
  }
}
