import mysql from 'mysql2/promise';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve all users with their employee numbers and emails
 *     description: Returns a list of users containing only their employee_number and email fields.
 *     responses:
 *       200:
 *         description: A JSON array of user objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_number:
 *                     type: integer
 *                     example: 12345
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: user@example.com
 *       500:
 *         description: Database error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Database error
 *                 details:
 *                   type: string
 *                   example: Error message details
 */

export async function GET(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    // Select only employee_number and email from users table
    const [rows] = await db.execute(`SELECT employee_number, email FROM users`);

    // Map to array of { employee_number, email }
    const users = rows.map(row => ({
      employee_number: row.employee_number,
      email: row.email,
    }));

    return new Response(JSON.stringify(users), {
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
