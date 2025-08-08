'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import styles from './departments.module.css';

export default function DepartmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();  // Initialize router
  const branchId = searchParams.get('branch_id');

  const [branchName, setBranchName] = useState('');
  const [originalBranchName, setOriginalBranchName] = useState('');
  const [departments, setDepartments] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [newDepartment, setNewDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    if (!branchId) {
      router.replace('/branches');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const branchRes = await fetch(`/api/branches?id=${branchId}`);

        if (branchRes.status === 404) {
          router.replace('/branches');
          return;
        }

        if (!branchRes.ok) throw new Error('Failed to fetch branch');
        const branchData = await branchRes.json();

        const deptRes = await fetch(`/api/departments?branch_id=${branchId}`);
        if (!deptRes.ok) throw new Error('Failed to fetch departments');
        const departmentsData = await deptRes.json();

        setBranchName(branchData[0].name);
        setOriginalBranchName(branchData[0].name);
        setDepartments(departmentsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, router]);

  const deleteBranch = async (name) => {
    try {
      const res = await fetch('/api/branches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || 'Failed to delete branch');

      setMessage('Branch deleted successfully!');
      setTimeout(() => {
        setMessage('');
        router.replace('/branches');
      }, 1500); // Redirect after short delay
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const addDepartment = async () => {
    if (!newDepartment.trim()) {
      setError('Please enter a valid department name');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDepartment, branch: branchId }),
      });

      if (!res.ok) throw new Error('Failed to add department');

      const created = await fetch(`/api/departments?branch_id=${branchId}`).then(res => res.json());
      setDepartments(created);
      setNewDepartment('');
      setMessage('Department added successfully!');

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };


  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>Manage Departments for branch {branchName}</h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panelsContainer}>
        <div className={styles.panel}>
          <h3 className={styles.heading2}>Edit Branch Details</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setMessage('');
              setError('');

              try {
                const res = await fetch(`/api/branches`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ id: branchId, name: branchName }),
                });

                if (!res.ok) throw new Error('Failed to update branch');

                setOriginalBranchName(branchName);
                setMessage('Branch name updated successfully.');
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            <label>
              Branch Name:
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className={styles.input}
              />
            </label>
            <button
              type="submit"
              className={styles.button}
              disabled={branchName === originalBranchName}
            >
              Save Changes
            </button>
          </form>
          <button
            className={styles.deleteButton}
            onClick={() => {
              if (confirm('Are you sure you want to delete this branch?')) {
                deleteBranch(branchName);
              }
            }}
          >
            Delete Branch
          </button>

        </div>

        <div className={styles.panel}>
          <h3 className={styles.heading2}>Departments</h3>

          <label className={styles.label}>Add a new department</label>
          <div className={styles.inputRow}>
            <input
              className={styles.inputNew}
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              placeholder="New department"
            />
            <button className={styles.buttonNew} onClick={addDepartment}>Add</button>
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
                filteredDepartments.map((dept) => (
                  <div
                    key={`${dept.dept_id}-${dept.name}`}
                    className={styles.itemRow}
                    title={`Department: ${dept.name}`}
                    onClick={() => router.push(`/roles?branch_id=${branchId}&dept_id=${dept.dept_id}`)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        router.push(`/roles?branch_id=${branchId}&dept_id=${dept.dept_id}`);
                      }
                    }}
                  >
                    <span className={styles.itemText}>{dept.name}</span>
                  </div>
                ))
              ) : (
                <p>No departments match your search.</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>

  );
}
