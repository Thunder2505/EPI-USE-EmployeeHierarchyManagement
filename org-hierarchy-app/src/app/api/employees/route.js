import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

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

    const pepper = email;
    const customSalt = employee_number;

    const combined = password + pepper + customSalt;

    const hashedPassword = await bcrypt.hash(combined, 10);

    await db.execute(
      `INSERT INTO employees 
       (employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary, email, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary, email, hashedPassword]
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
