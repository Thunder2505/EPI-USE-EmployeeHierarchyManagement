'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './roles.module.css';

export default function RolesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const branchId = searchParams.get('branch_id');
  const deptId = searchParams.get('dept_id');

  const [branchName, setBranchName] = useState('');
  const [deptName, setDeptName] = useState('');
  const [originalDeptName, setOriginalDeptName] = useState('');
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!branchId || !deptId) {
      router.replace('/branches');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch department name
        console.log('Fetching department name for deptId:', deptId);
        console.log('Branch ID:', branchId);
        const deptRes = await fetch(`/api/departments?branch_id=${branchId}&dept_id=${deptId}`);
        if (!deptRes.ok) throw new Error('Failed to fetch department');
        const deptData = await deptRes.json();
        setDeptName(deptData[0]?.name || '');
        setOriginalDeptName(deptData[0]?.name || '');
        console.log('Department Name:', deptName);

        // Fetch roles
        const roleRes = await fetch(`/api/roles?dept_id=${deptId}`);
        if (!roleRes.ok) throw new Error('Failed to fetch roles');
        const rolesData = await roleRes.json();
        setRoles(rolesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [branchId, deptId, router]);

  const updateDepartment = async () => {
    try {
      const res = await fetch(`/api/departments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dept_id: deptId, name: deptName }),
      });
      if (!res.ok) throw new Error('Failed to update department');
      setOriginalDeptName(deptName);
      setMessage('Department updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const addRole = async () => {
    if (!newRole.trim()) {
      setError('Please enter a valid role name');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      const res = await fetch(`/api/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole, dept_id: deptId }),
      });
      if (!res.ok) throw new Error('Failed to add role');
      const updated = await fetch(`/api/roles?dept_id=${deptId}`).then(res => res.json());
      setRoles(updated);
      setNewRole('');
      setMessage('Role added successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>
        Manage Roles for department {deptName} (Branch: {branchName})
      </h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panelsContainer}>
        {/* Department editing */}
        <div className={styles.panel}>
          <h3 className={styles.heading2}>Edit Department Details</h3>
          <label>
            Department Name:
            <input
              type="text"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              className={styles.input}
            />
          </label>
          <button
            className={styles.button}
            disabled={deptName === originalDeptName}
            onClick={updateDepartment}
          >
            Save Changes
          </button>
        </div>

        {/* Roles section */}
        <div className={styles.panel}>
          <h3 className={styles.heading2}>Roles</h3>
          <label className={styles.label}>Add a new role</label>
          <div className={styles.inputRow}>
            <input
              className={styles.inputNew}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="New role"
            />
            <button className={styles.buttonNew} onClick={addRole}>Add</button>
          </div>

          <div className={styles.listSection}>
            <p className={styles.listTitle}>Existing roles:</p>

            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search roles..."
                className={`${styles.input} ${styles.searchInput}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className={styles.resultsContainer}>
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <div key={role.role_id} className={styles.itemRow}>
                    <span className={styles.itemText}>{role.name}</span>
                  </div>
                ))
              ) : (
                <p>No roles match your search.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
