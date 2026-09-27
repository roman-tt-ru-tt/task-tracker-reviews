import { requireAuth, jsonResponse } from '../../_lib.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireAuth(request, env);
    if (!user.is_admin) {
      return jsonResponse({ error: 'Только для админа' }, 403);
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'pending';

    const res = await env.DB.prepare(`
      SELECT r.id, r.rating, r.title, r.body, r.status, r.created_at, u.username
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = ?
      ORDER BY r.created_at DESC
      LIMIT 200
    `).bind(status).all();

    return jsonResponse({ reviews: res.results || [] });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonResponse({ error: String(e) }, 500);
  }
}
