import mysql from 'mysql2/promise';

export async function GET(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.execute(`
      SELECT employee_number, name, surname
      FROM employees
      WHERE employee_number NOT IN (
        SELECT employee_id FROM reporting_line_managers
        UNION
        SELECT manager_id FROM reporting_line_managers
      )
    `);

    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'No employees found without reporting lines' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Database error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    await db.end();
  }
}
