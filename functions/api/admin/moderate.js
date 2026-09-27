import { requireAuth, jsonResponse } from '../../_lib.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireAuth(request, env);
    if (!user.is_admin) {
      return jsonResponse({ error: 'Только для админа' }, 403);
    }

    const { id, action } = await request.json();
    if (!['approve', 'reject'].includes(action)) {
      return jsonResponse({ error: 'Неверное действие' }, 400);
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await env.DB.prepare(
      `UPDATE reviews SET status = ?, moderated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(newStatus, id).run();

    return jsonResponse({ ok: true });
  } catch (e) {
    if (e instanceof Response) return e;
    return jsonResponse({ error: String(e) }, 500);
  }
}
