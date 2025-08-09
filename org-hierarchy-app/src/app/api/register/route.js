import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /user/eligibility:
 *   get:
 *     summary: Check if a user is eligible for registration
 *     description: Returns whether a user with a given employee_number exists without an email or password set.
 *     parameters:
 *       - in: query
 *         name: employee_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Employee number to check eligibility for
 *     responses:
 *       200:
 *         description: Eligibility status returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 eligible:
 *                   type: boolean
 *                   description: True if user is eligible (no email or password set), false otherwise
 *       400:
 *         description: Missing employee_number query parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const employee_number = searchParams.get('employee_number');

  if (!employee_number) {
    return new Response(JSON.stringify({ error: 'Missing employee_number' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await db.execute(
      `SELECT * FROM users WHERE employee_number = ? AND (email IS NULL OR email = '') AND (password IS NULL OR password = '')`,
      [employee_number]
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({ eligible: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ eligible: true }), {
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
 * /user/register:
 *   post:
 *     summary: Register a new user by setting email and password
 *     description: Registers a user by updating their email and hashed password using pepper and custom salt.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_number
 *               - email
 *               - password
 *             properties:
 *               employee_number:
 *                 type: string
 *                 description: Employee number of the user to register
 *                 example: "12345"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: User successfully registered (updated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated
 *       400:
 *         description: Missing required fields or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Database error
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
    const { employee_number, email, password } = body;

    if (!employee_number || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const pepper = email;
    const customSalt = employee_number;
    const combined = password + pepper + customSalt;

    const hashedPassword = await bcrypt.hash(combined, 10);

    const [existingUser] = await db.execute(
        `SELECT * FROM users WHERE employee_number = ? AND (email IS NOT NULL AND email != '')`,
        [employee_number]
        );
    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );    
    }

    await db.execute(
      `UPDATE users SET email = ?, password = ? WHERE employee_number = ?`,
      [email, hashedPassword, employee_number]
    );

    return new Response(JSON.stringify({ message: 'User updated' }), {
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
