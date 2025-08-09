'use client';

import { useState, useEffect } from 'react';
import styles from '../management.module.css';

export default function EditDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingDept, setEditingDept] = useState(null);
  const [editName, setEditName] = useState('');


  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch('/api/departments');
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        setDepartments(data);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchDepartments();
  }, []);

  const addDepartment = async () => {
    if (!newDeptName.trim()) {
      setError('Please enter a valid department name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim()}),
      });

      if (!res.ok) throw new Error('Failed to add department - Duplicate name?');

      const updated = await fetch('/api/departments').then(res => res.json());
      setDepartments(updated);
      setNewDeptName('');
      setMessage('Department added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const startEdit = (dept) => {
    setEditingDept(dept);
    setEditName(dept.name);
  };

  const cancelEdit = () => {
    setEditingDept(null);
    setEditName('');
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      setError('Department name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/departments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_id: editingDept.dept_id, name: editName.trim()}),
      });

      if (!res.ok) throw new Error('Failed to update department');

      setDepartments(prev =>
        prev.map(d => (d.dept_id === editingDept.dept_id ? { ...d, name: editName.trim() } : d))
      );
      setMessage('Department updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteDepartment = async (dept_id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const res = await fetch('/api/departments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_id }),
      });

      if (!res.ok) throw new Error('Failed to delete department');

      setDepartments(prev => prev.filter(d => d.dept_id !== dept_id));
      setMessage('Department deleted successfully!');
      setTimeout(() => setMessage(''), 3000);

      if (editingDept?.dept_id === dept_id) cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Manage Departments</h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panel}>
        <h3>Departments</h3>
        <label className={styles.label}>Add a new department</label>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            placeholder="New department"
          />
          <button className={styles.button} onClick={addDepartment}>Add</button>
        </div>

        <div className={styles.listSection}>
          <p className={styles.listTitle}>Existing departments:</p>

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search departments..."
              className={`${styles.input} ${styles.searchInput}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.resultsContainer}>
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map(dept => (
                <div key={dept.dept_id} className={styles.itemRow}>
                  {editingDept?.dept_id === dept.dept_id ? (
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
                      <span className={styles.itemText}>{dept.name}</span>
                      <button
                        className={styles.buttonSmall}
                        onClick={() => startEdit(dept)}
                        aria-label={`Edit ${dept.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.buttonSmall} ${styles.deleteButton}`}
                        onClick={() => deleteDepartment(dept.dept_id)}
                        aria-label={`Delete ${dept.name}`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No departments match your search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
