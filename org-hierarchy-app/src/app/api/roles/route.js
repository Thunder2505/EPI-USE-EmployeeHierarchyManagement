import mysql from 'mysql2/promise';

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get roles
 *     description: Retrieve a list of all roles or a single role by role_id.
 *     parameters:
 *       - in: query
 *         name: role_id
 *         schema:
 *           type: integer
 *         required: false
 *         description: Role ID to fetch a specific role.
 *     responses:
 *       200:
 *         description: A role or list of roles.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   role_id:
 *                     type: integer
 *                   name:
 *                     type: string
 *       404:
 *         description: Role not found.
 *       500:
 *         description: Database error.
 */

export async function GET(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const url = new URL(request.url);
    const roleId = url.searchParams.get('role_id');
    let rows;

    if (roleId) {
      // Get a single role
      const [result] = await db.execute(
        'SELECT * FROM roles WHERE role_id = ?',
        [roleId]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Role not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Get all roles from the department
      const [result] = await db.execute('SELECT * FROM roles ORDER BY name');
      rows = result;
    }

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
 * /roles:
 *   post:
 *     summary: Add a new role
 *     description: Insert a new role into the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name.
 *     responses:
 *       201:
 *         description: Role added successfully.
 *       500:
 *         description: Database error.
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
    const { name } = body;

    await db.execute(
      'INSERT INTO roles (name) VALUES (?)',
      [name]
    );

    return new Response(JSON.stringify({ message: 'Role added' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error adding role:', err);
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
 * /roles:
 *   put:
 *     summary: Update a role
 *     description: Update the name of an existing role by role_id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *               - name
 *             properties:
 *               role_id:
 *                 type: integer
 *                 description: Role ID.
 *               name:
 *                 type: string
 *                 description: New role name.
 *     responses:
 *       200:
 *         description: Role updated successfully.
 *       400:
 *         description: Missing role_id or name.
 *       500:
 *         description: Database error.
 */

export async function PUT(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    const { role_id, name } = body;

    if (!role_id || !name) {
      return new Response(JSON.stringify({ error: 'Role ID and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Updating role ID:', role_id, 'to name:', name);

    await db.execute(
      'UPDATE roles SET name = ? WHERE role_id = ?',
      [name, role_id]
    );

    return new Response(JSON.stringify({ message: 'Role updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error updating role:', err);
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
 * /roles:
 *   delete:
 *     summary: Delete a role
 *     description: Delete a role by role_id.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role_id
 *             properties:
 *               role_id:
 *                 type: integer
 *                 description: Role ID to delete.
 *     responses:
 *       200:
 *         description: Role deleted successfully.
 *       400:
 *         description: Missing role_id.
 *       500:
 *         description: Database error.
 */

export async function DELETE(request) {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  try {
    const body = await request.json();
    const { role_id } = body;

    if (!role_id) {
      return new Response(JSON.stringify({ error: 'Role ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Deleting role ID:', role_id);

    await db.execute(
      'DELETE FROM roles WHERE role_id = ?',
      [role_id]
    );

    return new Response(JSON.stringify({ message: 'Role deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error deleting role:', err);
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await db.end();
  }
}