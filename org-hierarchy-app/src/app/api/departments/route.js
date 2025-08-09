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
    let rows;
    if (deptId) {
      const [result] = await db.execute(
        'SELECT * FROM departments WHERE dept_id = ?',
        [deptId]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Department not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      const [result] = await db.execute('SELECT * FROM departments ORDER BY name');
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
    const { name } = body;

    await db.execute(
      'INSERT INTO departments (name) VALUES (?)',
      [name]
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

export async function PUT(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    const { dept_id, name } = body;

    if (!dept_id || !name) {
      return new Response(JSON.stringify({ error: 'Department ID and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.execute(
      'UPDATE departments SET name = ? WHERE dept_id = ?',
      [name, dept_id]
    );

    return new Response(JSON.stringify({ message: 'Department updated' }), {
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

export async function DELETE(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    const { dept_id } = body;
    if (!dept_id) {
      return new Response(JSON.stringify({ error: 'Department ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.execute('DELETE FROM departments WHERE dept_id = ?', [dept_id]);

    return new Response(JSON.stringify({ message: 'Department deleted' }), {
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