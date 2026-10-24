import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { getConnectionString } from '@netlify/database';
import pg from 'pg';
const pool = new pg.Pool({ connectionString: getConnectionString() });
export default async (req) => {
  const u = await getUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  if (req.method === 'GET') {
    const r = await pool.query('SELECT data FROM user_data WHERE user_id=$1', [u.id]);
    return Response.json({ data: r.rows[0] ? r.rows[0].data : null });
  }
  if (req.method === 'PUT') {
    verifyRequestOrigin(req);
    const { data } = await req.json();
    const txt = JSON.stringify(data || {});
    if (txt.length > 2000000) return new Response('Too large', { status: 413 });
    await pool.query(
      'INSERT INTO user_data (user_id,email,data,updated_at) VALUES ($1,$2,$3::jsonb,now()) ON CONFLICT (user_id) DO UPDATE SET data=$3::jsonb,email=$2,updated_at=now()',
      [u.id, u.email, txt]);
    return Response.json({ ok: true });
  }
  return new Response('Method not allowed', { status: 405 });
};
export const config = { path: '/api/data' };
