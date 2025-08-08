'use client';

import { useState, useEffect } from 'react';
import styles from '../management.module.css';

export default function EditEntitiesPage() {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [editingBranch, setEditingBranch] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches');
        if (!res.ok) throw new Error('Failed to fetch branches');
        const data = await res.json();
        setBranches(data);
      } catch (err) {
        setError(err.message);
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchBranches();
  }, []);

  const addBranch = async () => {
    if (!newBranch.trim()) {
      setError('Please enter a valid branch name');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBranch.trim() }),
      });

      if (!res.ok) throw new Error('Failed to add branch - Duplicate name?');

      const updated = await fetch('/api/branches').then(res => res.json());
      setBranches(updated);
      setNewBranch('');
      setMessage('Branch added successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const startEdit = (branch) => {
    setEditingBranch(branch);
    setEditName(branch.name);
  };

  const cancelEdit = () => {
    setEditingBranch(null);
    setEditName('');
  };

  const saveEdit = async () => {
    if (!editName.trim()) {
      setError('Branch name cannot be empty');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const res = await fetch(`/api/branches`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({id:editingBranch.branch_id, name: editName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update branch');

      setBranches(prev =>
        prev.map(b => (b.branch_id === editingBranch.branch_id ? { ...b, name: editName.trim() } : b))
      );
      setMessage('Branch updated successfully!');
      setTimeout(() => setMessage(''), 3000);
      cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteBranch = async (branch_id) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const res = await fetch('/api/branches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id }),
      });

      if (!res.ok) throw new Error('Failed to delete branch');

      setBranches(prev => prev.filter(b => b.branch_id !== branch_id));
      setMessage('Branch deleted successfully!');
      setTimeout(() => setMessage(''), 3000);

      if (editingBranch?.branch_id === branch_id) cancelEdit();
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };


  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Manage Branches</h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panel}>
        <h3>Branches</h3>
        <label className={styles.label}>Add a new branch</label>

        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            placeholder="New branch"
          />
          <button className={styles.button} onClick={addBranch}>Add</button>
        </div>

        <div className={styles.listSection}>
          <p className={styles.listTitle}>Existing branches:</p>

          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search branches..."
              className={`${styles.input} ${styles.searchInput}`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.resultsContainer}>
            {filteredBranches.length > 0 ? (
              filteredBranches.map(branch => (
                <div key={branch.branch_id} className={styles.itemRow}>
                  {editingBranch?.branch_id === branch.branch_id ? (
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
                      <span className={styles.itemText}>{branch.name}</span>
                      <button
                        className={styles.buttonSmall}
                        onClick={() => startEdit(branch)}
                        aria-label={`Edit ${branch.name}`}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.buttonSmall} ${styles.deleteButton}`}
                        onClick={() => deleteBranch(branch.branch_id)}
                        aria-label={`Delete ${branch.name}`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p>No branches match your search.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
