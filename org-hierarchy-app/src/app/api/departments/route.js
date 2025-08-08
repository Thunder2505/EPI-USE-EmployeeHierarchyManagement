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
    const branchId = url.searchParams.get('branch_id');
    const deptId = url.searchParams.get('dept_id');

    if (!branchId) {
      return new Response(JSON.stringify({ error: 'Branch ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let rows;

    if (deptId) {
      // Get a single department from the branch
      const [result] = await db.execute(
        'SELECT * FROM departments WHERE branch = ? AND dept_id = ?',
        [branchId, deptId]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Department not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Get all departments from the branch
      const [result] = await db.execute(
        'SELECT * FROM departments WHERE branch = ? ORDER BY name',
        [branchId]
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
    const { name, branch } = body;

    await db.execute(
      'INSERT INTO departments (name, branch) VALUES (?, ?)',
      [name, branch]
    );

    return new Response(JSON.stringify({ message: 'Department added' }), {
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
