import mysql from 'mysql2/promise';

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags:
 *       - Employees
 *     responses:
 *       200:
 *         description: A list of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_number:
 *                     type: integer
 *                   dept_number:
 *                     type: integer
 *                   branch_number:
 *                     type: integer
 *                   role_number:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   surname:
 *                     type: string
 *                   birth_date:
 *                     type: string
 *                     format: date
 *                   salary:
 *                     type: number
 *       500:
 *         description: Database error
 */

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

/**
 * @swagger
 * /api/employees:
 *   post:
 *     summary: Add a new employee
 *     tags:
 *       - Employees
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_number
 *               - dept_number
 *               - branch_number
 *               - role_number
 *               - name
 *               - surname
 *               - birth_date
 *               - salary
 *             properties:
 *               employee_number:
 *                 type: integer
 *               dept_number:
 *                 type: integer
 *               branch_number:
 *                 type: integer
 *               role_number:
 *                 type: integer
 *               name:
 *                 type: string
 *               surname:
 *                 type: string
 *               birth_date:
 *                 type: string
 *                 format: date
 *               salary:
 *                 type: number
 *     responses:
 *       201:
 *         description: Employee added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Database error
 */

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
