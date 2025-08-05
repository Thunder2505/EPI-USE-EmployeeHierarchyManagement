// /pages/api/employees.js
import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    if (req.method === 'GET') {
      const [rows] = await db.execute('SELECT * FROM roles');
      res.status(200).json(rows);
    } else if (req.method === 'POST') {
      const { role_number, role_name } = req.body;
      await db.execute('INSERT INTO roles (role_id, role_name) VALUES (?, ?)', [role_number, role_name]);
      res.status(201).json({ message: 'Role added' });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    await db.end();
  }
}
