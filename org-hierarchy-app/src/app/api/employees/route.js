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
    const employeeNumber = url.searchParams.get('employee_number');

    let rows;
    if (employeeNumber) {
      // Get one employee by employee_number
      const [result] = await db.execute(
        'SELECT * FROM employees WHERE employee_number = ?',
        [employeeNumber]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Employee not found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Get all employees
      const [result] = await db.execute('SELECT * FROM employees ORDER BY employee_number');
      rows = result;
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
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
    } = body;

    await db.execute(
      `INSERT INTO employees 
       (employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_number, dept_number, branch_number, role_number, name, surname, birth_date, salary]
    );

    await db.execute(
      `INSERT INTO users (employee_number) 
       VALUES (?)`,
      [employee_number]
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

export async function PUT(request) {
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
    } = body;

    await db.execute(
      `UPDATE employees 
       SET dept_number = ?, branch_number = ?, role_number = ?, name = ?, surname = ?, birth_date = ?, salary = ? 
       WHERE employee_number = ?`,
      [dept_number, branch_number, role_number, name, surname, birth_date, salary, employee_number]
    );

    return new Response(JSON.stringify({ message: 'Employee updated' }), {
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
    const { searchParams } = new URL(request.url);
    const employee_number = searchParams.get('employee_number');

    if (!employee_number) {
      return new Response(JSON.stringify({ error: 'Employee number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    await db.execute('DELETE FROM users WHERE employee_number = ?', [employee_number]);
    await db.execute('DELETE FROM employees WHERE employee_number = ?', [employee_number]);

    return new Response(JSON.stringify({ message: 'Employee deleted' }), {
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