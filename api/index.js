const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// Sample root route
app.get('/', (req, res) => {
  res.send('Hello from Express API!');
});

// Example: GET all employees (stubbed example)
app.get('/employees', (req, res) => {
  // Replace with actual DB logic later
  res.json([
    { id: 1, name: 'John Doe', role: 'CEO' },
    { id: 2, name: 'Jane Smith', role: 'CTO' }
  ]);
});

// Detect if running on Vercel serverless or local
const isServerless = !!process.env.VERCEL;

if (!isServerless) {
  // Running locally: listen on port 3000
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
} else {
  // Export handler for Vercel serverless
  module.exports.handler = serverless(app);
}
