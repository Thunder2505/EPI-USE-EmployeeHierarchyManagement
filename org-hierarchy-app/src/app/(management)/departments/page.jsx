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
        </div>

        <div className={styles.panel}>
          {/* Content for second panel */}
          <h3 className={styles.heading2}>Departments</h3>
          {departments.length === 0 ? (
            <p>No departments found.</p>
          ) : (
            <ul className={styles.departmentList}>
              {departments.map((dept) => (
                <li key={dept.id} className={styles.departmentItem}>
                  <span>{dept.name}</span>
                  {/* You can add edit/delete buttons here */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>

  );
}
