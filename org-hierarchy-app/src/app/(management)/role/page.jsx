'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './role.module.css';

export default function RolePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleId = searchParams.get('role_id');
  const deptId = searchParams.get('dept_id');
  const branchId = searchParams.get('branch_id');

  const [roleName, setRoleName] = useState('');
  const [originalRoleName, setOriginalRoleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!roleId || !deptId) {
      router.replace('/roles');
      return;
    }

    const fetchRole = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/roles?role_id=${roleId}&dept_id=${deptId}`);
        if (!res.ok) throw new Error('Failed to fetch role');
        const data = await res.json();
        // Assuming data is an array with one role object
        setRoleName(data[0]?.name || '');
        setOriginalRoleName(data[0]?.name || '');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [roleId, router]);

  const updateRole = async () => {
    try {
      const res = await fetch(`/api/roles`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: roleId, name: roleName }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      setOriginalRoleName(roleName);
      setMessage('Role updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteRole = async (id) => {
    try {
      const res = await fetch(`/api/roles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_id: id }),
      });
      if (!res.ok) throw new Error('Failed to delete role');
      setMessage('Role deleted successfully');
      setTimeout(() => setMessage(''), 3000);
      router.replace('/roles?branch_id=' + branchId + '&dept_id=' + deptId);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.page}>
      <h2 className={styles.heading}>
        Edit Role: {roleName}
      </h2>

      {message && <div className={styles.message}>{message}</div>}
      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panel}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await updateRole();
          }}
        >
          <label>
            Role Name:
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className={styles.input}
            />
          </label>
          <button
            type="submit"
            className={styles.button}
            disabled={roleName === originalRoleName}
          >
            Save Changes
          </button>
        </form>
        <button
          className={styles.deleteButton}
          onClick={async () => {
            await deleteRole(roleId);
          }}
        >
          Delete Role
        </button>
      </div>
    </div>
  );
}
