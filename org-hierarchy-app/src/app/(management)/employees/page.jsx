'use client';

import React, { useState, useEffect } from 'react';
import styles from './employees.module.css';

export default function AddEmployee() {
  const [form, setForm] = useState({
    employee_number: '',
    branch_number: '',
    dept_number: '',
    role_number: '',
    name: '',
    surname: '',
    birth_date: '',
    salary: '',
  });

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Fetch all dropdown data independently on mount
  useEffect(() => {
    async function fetchAllData() {
      setLoadingBranches(true);
      setLoadingDepartments(true);
      setLoadingRoles(true);

      try {
        const [branchesRes, departmentsRes, rolesRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/departments'),
          fetch('/api/roles'),
        ]);

        if (!branchesRes.ok) throw new Error('Failed to fetch branches');
        if (!departmentsRes.ok) throw new Error('Failed to fetch departments');
        if (!rolesRes.ok) throw new Error('Failed to fetch roles');

        const [branchesData, departmentsData, rolesData] = await Promise.all([
          branchesRes.json(),
          departmentsRes.json(),
          rolesRes.json(),
        ]);

        setBranches(branchesData);
        setDepartments(departmentsData);
        setRoles(rolesData);
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Failed to load dropdown data' });
      } finally {
        setLoadingBranches(false);
        setLoadingDepartments(false);
        setLoadingRoles(false);
      }
    }

    fetchAllData();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setMessage(null);

    for (const field of [
      'employee_number',
      'branch_number',
      'dept_number',
      'role_number',
      'name',
      'surname',
      'birth_date',
      'salary',
    ]) {
      if (!form[field]) {
        setMessage({ type: 'error', text: `Field "${field}" is required.` });
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_number: form.employee_number,
          branch_number: Number(form.branch_number),
          dept_number: Number(form.dept_number),
          role_number: Number(form.role_number),
          name: form.name,
          surname: form.surname,
          birth_date: form.birth_date,
          salary: Number(form.salary),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Employee added successfully.' });
        setForm({
          employee_number: '',
          branch_number: '',
          dept_number: '',
          role_number: '',
          name: '',
          surname: '',
          birth_date: '',
          salary: '',
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add employee.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Network error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Add Employee</h1>

      {message && (
        <p className={message.type === 'success' ? styles.message : styles.error}>
          {message.text}
        </p>
      )}
      <div className={styles.panel}>
        <form onSubmit={handleSubmit} className={styles.formContainer}>

          <label className={styles.label}>
            Employee Number
            <input
              type="text"
              name="employee_number"
              className={styles.inputText}
              value={form.employee_number}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Branch
            <select
              name="branch_number"
              className={styles.inputSelect}
              onChange={handleChange}
              value={form.branch_number}
              disabled={loadingBranches}
              required
            >
              <option value="">Select branch...</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Department
            <select
              name="dept_number"
              className={styles.inputSelect}
              onChange={handleChange}
              value={form.dept_number}
              disabled={loadingDepartments}
              required
            >
              <option value="">Select department...</option>
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Role
            <select
              name="role_number"
              className={styles.inputSelect}
              onChange={handleChange}
              value={form.role_number}
              disabled={loadingRoles}
              required
            >
              <option value="">Select role...</option>
              {roles.map(role => (
                <option key={role.role_id} value={role.role_id}>
                  {role.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.label}>
            Name
            <input
              type="text"
              name="name"
              className={styles.inputText}
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Surname
            <input
              type="text"
              name="surname"
              className={styles.inputText}
              value={form.surname}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Birth Date
            <input
              type="date"
              name="birth_date"
              className={styles.inputDate}
              value={form.birth_date}
              onChange={handleChange}
              required
            />
          </label>

          <label className={styles.label}>
            Salary
            <input
              type="number"
              step="0.01"
              name="salary"
              className={styles.inputNumber}
              value={form.salary}
              onChange={handleChange}
              required
            />
          </label>

          <button
            type="submit"
            className={`${styles.buttonSubmit} ${styles.mt1rem}`}
            disabled={submitting}
          >
            {submitting ? 'Adding...' : 'Add Employee'}
          </button>
        </form>
      </div>
    </main>
  );
}
