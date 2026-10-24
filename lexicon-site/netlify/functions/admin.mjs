import { getUser, admin, verifyRequestOrigin } from '@netlify/identity';
import { getConnectionString } from '@netlify/database';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: getConnectionString() });
export default async (req) => {
  const u = await getUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  if (!(u.roles || []).includes('admin')) return new Response('Forbidden', { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  if (req.method === 'DELETE' && id) {
    verifyRequestOrigin(req);
    await pool.query('DELETE FROM user_data WHERE user_id=$1', [id]);
    return Response.json({ ok: true });
  }
  if (req.method === 'GET' && id) {
    const r = await pool.query('SELECT data FROM user_data WHERE user_id=$1', [id]);
    return Response.json({ data: r.rows[0] ? r.rows[0].data : null });
  }
  if (req.method === 'GET') {
    const [list, rows] = await Promise.all([admin.listUsers(), pool.query('SELECT user_id,data,updated_at FROM user_data')]);
    const by = new Map(rows.rows.map((r) => [r.user_id, r]));
    const users = list.map((x) => { const r = by.get(x.id); return { id: x.id, email: x.email, words: r && Array.isArray(r.data.words) ? r.data.words.length : 0, updated: r ? r.updated_at : null }; });
    return Response.json({ users });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/admin' };
