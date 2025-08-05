// Simplified example for session validation endpoint
import mysql from 'mysql2/promise';

export async function POST(req) {
  const { token } = await req.json();

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.execute('SELECT token_expire FROM users WHERE token = ?', [token]);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ valid: false }), { status: 401 });
    }

    const tokenExpire = new Date(rows[0].token_expire);
    const now = new Date();

    if (tokenExpire <= now) {
      return new Response(JSON.stringify({ valid: false }), { status: 401 });
    }

    return new Response(JSON.stringify({ valid: true, expiry: tokenExpire.toISOString() }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  } finally {
    await db.end();
  }
}
