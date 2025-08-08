import mysql from 'mysql2/promise';

export async function GET(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const url = new URL(request.url);
    const deptId = url.searchParams.get('dept_id');
    const roleId = url.searchParams.get('role_id');

    if (!deptId) {
      return new Response(JSON.stringify({ error: 'Department ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let rows;

    if (roleId) {
      // Get a single role from the department
      const [result] = await db.execute(
        'SELECT * FROM roles WHERE department_id = ? AND role_id = ?',
        [deptId, roleId]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Get all roles from the department
      const [result] = await db.execute(
        'SELECT * FROM roles WHERE department_id = ? ORDER BY name',
        [deptId]
      );
      rows = result;
    }

    return new Response(JSON.stringify(rows), {
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
    const { name, department_id } = body;

    await db.execute(
      'INSERT INTO roles (name, department_id) VALUES (?, ?)',
      [name, department_id]
    );

    return new Response(JSON.stringify({ message: 'Role added' }), {
      status: 201,
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
