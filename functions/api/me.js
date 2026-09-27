import { getCurrentUser, jsonResponse } from '../_lib.js';

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ user: null });
  return jsonResponse({ user: { username: user.username, is_admin: user.is_admin === 1 } });
}
