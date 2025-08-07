'use client';

import { useState, useEffect } from 'react';
import styles from './branches.module.css';
import { useRouter } from 'next/navigation';

export default function EditEntitiesPage() {
  const router = useRouter();
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(""); 

  useEffect(() => {
    const fetchBranches = async () => {
      const res = await fetch('/api/branches');
      const data = await res.json();
      setBranches(data);
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
        body: JSON.stringify({ name: newBranch }),
      });

      if (!res.ok) throw new Error('Failed to add branch');

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

  const filteredBranches = branches.filter(branch =>
    branch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const goToDepartments = (branchId) => {
    router.push(`/departments?branch_id=${branchId}`);
  };

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
          filteredBranches.map((branch) => (
            <div
              key={branch.branch_id}
              className={styles.itemRow}
              onClick={() => goToDepartments(branch.branch_id)}
              style={{ cursor: 'pointer' }}
              title={`Go to departments for ${branch.name}`}
              tabIndex={0} // for accessibility
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  goToDepartments(branch.branch.id);
                }
              }}
            >
              <span className={styles.itemText}>{branch.name}</span>
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
