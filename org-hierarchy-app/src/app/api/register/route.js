import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employee_number = searchParams.get('employee_number');

  if (!employee_number) {
    return new Response(JSON.stringify({ error: 'Missing employee_number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE employee_number = ? AND (email IS NULL OR email = '') AND (password IS NULL OR password = '')`,
      [employee_number]
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({ eligible: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ eligible: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await db.end();
  }
}

export async function POST(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    const { employee_number, email, password } = body;

    if (!employee_number || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pepper = email;
    const customSalt = employee_number;
    const combined = password + pepper + customSalt;

    const hashedPassword = await bcrypt.hash(combined, 10);

    const [existingUser] = await db.execute(
        `SELECT * FROM users WHERE employee_number = ? AND (email IS NOT NULL AND email != '')`,
        [employee_number]
        );
    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );    
    }

    await db.execute(
      `UPDATE users SET email = ?, password = ? WHERE employee_number = ?`,
      [email, hashedPassword, employee_number]
    );

    return new Response(JSON.stringify({ message: 'User updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await db.end();
  }
}
