import { signup, login, logout, getUser, verifyRequestOrigin } from '@netlify/identity';
const out = (o, s = 200) => Response.json(o, { status: s });
const pub = (u) => ({ email: u.email, admin: (u.roles || []).includes('admin') });
export default async (req) => {
  try {
    if (req.method === 'GET') { const u = await getUser(); return out({ user: u ? pub(u) : null }); }
    verifyRequestOrigin(req);
    const { action, email, password } = await req.json();
    if (action === 'logout') { await logout(); return out({ ok: true }); }
    if (action === 'signup') {
      const u = await signup(email, password);
      if (u.emailVerified === false) return out({ confirm: true });
      return out({ user: pub(await login(email, password)) });
    }
    if (action === 'login') return out({ user: pub(await login(email, password)) });
    return out({ error: 'Unknown action' }, 400);
  } catch (e) { return out({ error: e.message || 'Something went wrong' }, 400); }
};
export const config = { path: '/api/auth' };
