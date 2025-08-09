import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and generate a login token
 *     description: Verifies user credentials and returns an authentication token along with user role.
 *     requestBody:
 *       description: User email and password for login
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mysecretpassword
 *     responses:
 *       200:
 *         description: Login successful, returns token and user role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: Authentication token
 *                 role:
 *                   type: string
 *                   description: User role name
 *       400:
 *         description: Missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Database error or missing employee/role data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const { email, password } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user = rows[0];
    const combined = password + email + user.employee_number;
    const passwordMatch = await bcrypt.compare(combined, user.password);

    if (!passwordMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get role_number from employees table using employee_number
    const [employeeRows] = await db.execute(
      'SELECT role_number FROM employees WHERE employee_number = ?',
      [user.employee_number]
    );

    if (employeeRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Employee data not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const roleNumber = employeeRows[0].role_number;

    // Get role name from roles table using role_number
    const [roleRows] = await db.execute(
      'SELECT name FROM roles WHERE role_id = ?',
      [roleNumber]
    );

    if (roleRows.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Role data not found' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const roleName = roleRows[0].name;

    const token = crypto.randomBytes(32).toString('hex');

    const expires = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const expiresFormatted = expires.toISOString().slice(0, 19).replace('T', ' ');

    await db.execute(
      'UPDATE users SET token = ?, token_expire = ? WHERE email = ?',
      [token, expiresFormatted, email]
    );

    return new Response(
      JSON.stringify({ message: 'Login successful', token, role: roleName }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await db.end();
  }
}
