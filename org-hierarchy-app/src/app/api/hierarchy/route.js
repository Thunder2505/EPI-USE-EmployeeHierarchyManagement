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
    const employee_id = url.searchParams.get('employee_id');
    let rows;
    
    if (employee_id) {
      const [result] = await db.execute(
        'SELECT * FROM reporting_line_managers WHERE employee_id = ?',
        [employee_id]
      );
      rows = result;

      if (rows.length === 0) {
        return new Response(JSON.stringify({ error: 'Employee not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      const [result] = await db.execute('SELECT * FROM reporting_line_managers');
      rows = result;
    }

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Database error in GET:', err);
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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
    const data = await request.json();
    const { employee_id, manager_id } = data;

    if (!employee_id || !manager_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id and manager_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if the relationship would create a circular reference
    const isCircular = await checkCircularReference(db, employee_id, manager_id);
    if (isCircular) {
      return new Response(
        JSON.stringify({ error: 'Cannot create circular reporting relationship' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if employee and manager exist
    const [employeeCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM employees WHERE employee_number = ?',
      [employee_id]
    );
    const [managerCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM employees WHERE employee_number = ?',
      [manager_id]
    );

    if (employeeCheck[0].count === 0) {
      return new Response(
        JSON.stringify({ error: 'Employee does not exist' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (managerCheck[0].count === 0) {
      return new Response(
        JSON.stringify({ error: 'Manager does not exist' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if relationship already exists
    const [existingCheck] = await db.execute(
      'SELECT COUNT(*) as count FROM reporting_line_managers WHERE employee_id = ? AND manager_id = ?',
      [employee_id, manager_id]
    );

    if (existingCheck[0].count > 0) {
      return new Response(
        JSON.stringify({ message: 'Relationship already exists' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await db.execute(
      'INSERT INTO reporting_line_managers (employee_id, manager_id) VALUES (?, ?)',
      [employee_id, manager_id]
    );

    return new Response(JSON.stringify({ message: 'Manager added successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Database error in POST:', err);
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
    const data = await request.json();
    const { employee_id, manager_id } = data;

    if (!employee_id || !manager_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id and manager_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [result] = await db.execute(
      'DELETE FROM reporting_line_managers WHERE employee_id = ? AND manager_id = ?',
      [employee_id, manager_id]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'No matching record found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ message: 'Manager removed successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Database error in DELETE:', err);
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
    const data = await request.json();
    const { employee_id, manager_id, old_manager_id } = data;

    if (!employee_id || !manager_id) {
      return new Response(
        JSON.stringify({ error: 'employee_id and manager_id are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for circular reference
    const isCircular = await checkCircularReference(db, employee_id, manager_id);
    if (isCircular) {
      return new Response(
        JSON.stringify({ error: 'Cannot create circular reporting relationship' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Start transaction for atomic operation
    await db.beginTransaction();

    try {
      // Remove old relationship if specified
      if (old_manager_id) {
        await db.execute(
          'DELETE FROM reporting_line_managers WHERE employee_id = ? AND manager_id = ?',
          [employee_id, old_manager_id]
        );
      } else {
        // Remove any existing relationships for this employee
        await db.execute(
          'DELETE FROM reporting_line_managers WHERE employee_id = ?',
          [employee_id]
        );
      }

      // Add new relationship
      await db.execute(
        'INSERT INTO reporting_line_managers (employee_id, manager_id) VALUES (?, ?)',
        [employee_id, manager_id]
      );

      await db.commit();

      return new Response(JSON.stringify({ message: 'Manager updated successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (transactionError) {
      await db.rollback();
      throw transactionError;
    }

  } catch (err) {
    console.error('Database error in PUT:', err);
    return new Response(
      JSON.stringify({ error: 'Database error', details: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await db.end();
  }
}

// Helper function to check for circular references
async function checkCircularReference(db, employeeId, managerId) {
  // If employee is trying to report to themselves
  if (employeeId === managerId) {
    return true;
  }

  // Check if the new manager is already reporting to the employee (directly or indirectly)
  const visited = new Set();
  const queue = [managerId];

  while (queue.length > 0) {
    const currentEmployee = queue.shift();
    
    if (visited.has(currentEmployee)) {
      continue;
    }
    
    visited.add(currentEmployee);

    // If we find the employee in the manager's reporting chain, it's circular
    if (currentEmployee === employeeId) {
      return true;
    }

    // Get all managers of the current employee
    const [managers] = await db.execute(
      'SELECT manager_id FROM reporting_line_managers WHERE employee_id = ?',
      [currentEmployee]
    );

    for (const manager of managers) {
      if (!visited.has(manager.manager_id)) {
        queue.push(manager.manager_id);
      }
    }
  }

  return false;
}