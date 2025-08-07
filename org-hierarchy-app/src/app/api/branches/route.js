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
    const id = url.searchParams.get('id');

    let rows;
    if (id) {
      const [result] = await db.execute(
        'SELECT * FROM branches WHERE branch_id = ?',
        [id]
      );
      rows = result;
    } else {
      const [result] = await db.execute('SELECT * FROM branches ORDER BY name');
      rows = result;
    }

    if (id && rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Branch not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
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
      'INSERT INTO branches (name) VALUES (?)',
      [name]
    );

    return new Response(JSON.stringify({ message: 'Branch added' }), {
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

export async function DELETE(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    console.log('Received body:', body);
    const { name } = body;
    console.log('Deleting branch:', name);
    const [result] = await db.execute('DELETE FROM branches WHERE name = ?', [name]);
    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'Branch not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    else {
      return new Response(JSON.stringify({ message: 'Branch deleted' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return new Response(
        JSON.stringify({
          error: 'Cannot delete branch',
          message: 'This branch is still in use by one or more employees. Remove or reassign those employees first.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Database error',
        details: err.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  finally {
    await db.end();
  }
}