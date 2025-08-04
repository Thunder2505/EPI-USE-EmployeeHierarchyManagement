import express from 'express';
import serverless from 'serverless-http';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

// Create MySQL pool using env variables
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.get('/', (req, res) => {
  res.send('Hello from Vercel API with MySQL!');
});

app.get('/employees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Required for Vercel
export default serverless(app);
