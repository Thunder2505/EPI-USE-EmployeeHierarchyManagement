'use client';

import { useState, useEffect } from 'react';
import styles from '../management.module.css';

export default function EditRolesPage() {
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingRole, setEditingRole] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/roles');
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchRoles();
  }, []);

  const addRole = async () => {
    if (!newRoleName.trim()) {
      setError('Please enter a valid role name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to add role - Duplicate name?');

      const updated = await fetch('/api/roles').then(res => res.json());
      setRoles(updated);
      setNewRoleName('');
      setMessage('Role added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const startEdit = (role) => {
    setEditingRole(role);
    setEditName(role.name);
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setEditName('');
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      setError('Role name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: editingRole.role_id, name: editName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update role');

      setRoles(prev =>
        prev.map(r => (r.role_id === editingRole.role_id ? { ...r, name: editName.trim() } : r))
      );
      setMessage('Role updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteRole = async (role_id) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    try {
      const res = await fetch('/api/roles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id }),
      });

      if (!res.ok) throw new Error('Failed to delete role');

      setRoles(prev => prev.filter(r => r.role_id !== role_id));
      setMessage('Role deleted successfully!');
      setTimeout(() => setMessage(''), 3000);

      if (editingRole?.role_id === role_id) cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Manage Roles</h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panel}>
        <h3>Roles</h3>
        <label className={styles.label}>Add a new role</label>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="New role"
          />
          <button className={styles.button} onClick={addRole}>Add</button>
        </div>

        <div className={styles.listSection}>
          <p className={styles.listTitle}>Existing roles:</p>

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search roles..."
              className={`${styles.input} ${styles.searchInput}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.resultsContainer}>
            {filteredRoles.length > 0 ? (
              filteredRoles.map(role => (
                <div key={role.role_id} className={styles.itemRow}>
                  {editingRole?.role_id === role.role_id ? (
                    <>
                      <input
                        className={styles.input}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                      />
                      <button className={styles.buttonSmall} onClick={saveEdit}>Save</button>
                      <button className={styles.buttonSmall} onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className={styles.itemText}>{role.name}</span>
                      <button
                        className={styles.buttonSmall}
                        onClick={() => startEdit(role)}
                        aria-label={`Edit ${role.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.buttonSmall} ${styles.deleteButton}`}
                        onClick={() => deleteRole(role.role_id)}
                        aria-label={`Delete ${role.name}`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No roles match your search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
