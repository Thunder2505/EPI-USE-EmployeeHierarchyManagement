import mysql from 'mysql2/promise';

export async function GET(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.execute('SELECT * FROM employees');
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

    const {
      employee_number,
      dept_number,
      branch_number,
      role_number,
      name,
      surname,
      birth_date,
      salary,
      email,
      password,
    } = body;

    await db.execute(
      `INSERT INTO employees 
       (employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary, email, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary, email, password]
    );

    return new Response(JSON.stringify({ message: 'Employee added' }), {
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
