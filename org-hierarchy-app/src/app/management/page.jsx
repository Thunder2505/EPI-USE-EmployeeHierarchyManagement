'use client';

import { useState, useEffect } from 'react';

export default function EditEntitiesPage() {
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [newBranch, setNewBranch] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newRole, setNewRole] = useState('');

  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [b, d, r] = await Promise.all([
        fetch('/api/branches').then((res) => res.json()),
        fetch('/api/departments').then((res) => res.json()),
        fetch('/api/roles').then((res) => res.json()),
      ]);
      setBranches(b);
      setDepartments(d);
      setRoles(r);
    };

    fetchData();
  }, []);

  const handleAdd = async (type, value, setValue, setList) => {
    const endpoint = `/api/${type}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value }),
      });

      if (!res.ok) throw new Error('Failed to add ' + type);

      const updated = await res.json();
      setList(updated);
      setValue('');
      setMessage(`${type} added successfully!`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  };

  const renderPanel = (title, items, inputValue, setInput, onAddClick) => (
    <div className="flex-1 border rounded-2xl shadow-md p-6 mb-6 md:mb-0 md:mr-4 last:mr-0"
      style={{
        background: 'var(--foreground)',
        color: 'var(--text)',
        borderColor: 'var(--border)',
        boxShadow: '0 2px 8px var(--shadow)',
      }}
    >
      <h3 className="text-xl font-semibold mb-4 text-center">{title}</h3>

      <div className="mb-4">
        <label className="block text-sm mb-1">
          Add new {title === 'Branches'
            ? 'branch'
            : title === 'Departments'
            ? 'department'
            : title === 'Roles'
            ? 'role'
            : title.toLowerCase()}
        </label>

        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`New ${title.toLowerCase().slice(0, -1)}`}
            className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={onAddClick}
            className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Existing {title.toLowerCase()}:</p>
        <ul className="list-disc list-inside text-sm text-gray-800 dark:text-gray-300 max-h-60 overflow-y-auto pr-2">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <li key={idx}>
                {typeof item === 'string' ? item : item.dept_Name}
              </li>
            ))
          ) : (
            <li className="text-gray-500 italic">No data</li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <div className="w-full max-w-7xl p-8">
        <h2 className="text-2xl font-bold text-center mb-8">Manage Entities</h2>

        {message && (
          <div className="mb-6 text-center text-green-600 dark:text-green-400 font-medium">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-6">
          {renderPanel(
            'Branches',
            branches,
            newBranch,
            setNewBranch,
            () => handleAdd('branches', newBranch, setNewBranch, setBranches)
          )}
          {renderPanel(
            'Departments',
            departments,
            newDepartment,
            setNewDepartment,
            () => handleAdd('departments', newDepartment, setNewDepartment, setDepartments)
          )}
          {renderPanel(
            'Roles',
            roles,
            newRole,
            setNewRole,
            () => handleAdd('roles', newRole, setNewRole, setRoles)
          )}
        </div>
      </div>
    </div>
  );
}
