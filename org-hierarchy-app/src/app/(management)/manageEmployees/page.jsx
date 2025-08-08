'use client';

import React, { useState, useEffect } from 'react';
import styles from './employees.module.css';

export default function EditEmployeePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Dropdown data states
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // Editing state: employee being edited + form data
  const [editingEmployeeNumber, setEditingEmployeeNumber] = useState(null);
  const [editForm, setEditForm] = useState({
    employee_number: '',
    branch_number: '',
    dept_number: '',
    role_number: '',
    name: '',
    surname: '',
    birth_date: '',
    salary: '',
  });

  // Fetch employees once on mount
  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true);
      try {
        const res = await fetch('/api/employees');
        if (!res.ok) throw new Error('Failed to fetch employees');
        const data = await res.json();
        setEmployees(data);
        setFilteredEmployees(data);
      } catch (err) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  // Fetch dropdown data once on mount
  useEffect(() => {
    async function fetchDropdowns() {
      setLoadingDropdowns(true);
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
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoadingDropdowns(false);
      }
    }
    fetchDropdowns();
  }, []);

  // Filter employees by search term (employee_number or name/surname)
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter(emp =>
          emp.employee_number.toString().includes(term) ||
          emp.name.toLowerCase().includes(term) ||
          emp.surname.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, employees]);

  // Start editing an employee - populate edit form
  const startEdit = emp => {
    setEditingEmployeeNumber(emp.employee_number);
    setEditForm({
      employee_number: emp.employee_number,
      branch_number: emp.branch_number,
      dept_number: emp.dept_number,
      role_number: emp.role_number,
      name: emp.name,
      surname: emp.surname,
      birth_date: emp.birth_date.slice(0, 10), // yyyy-mm-dd
      salary: emp.salary,
    });
    setMessage(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingEmployeeNumber(null);
    setEditForm({
      employee_number: '',
      branch_number: '',
      dept_number: '',
      role_number: '',
      name: '',
      surname: '',
      birth_date: '',
      salary: '',
    });
    setMessage(null);
  };

  const handleEditChange = e => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Save edited employee details
  const saveEdit = async () => {
    // Basic validation
    for (const field of ['employee_number', 'branch_number', 'dept_number', 'role_number', 'name', 'surname', 'birth_date', 'salary']) {
      if (!editForm[field]) {
        setMessage({ type: 'error', text: `Field "${field}" is required.` });
        return;
      }
    }

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_number: Number(editForm.employee_number),
          branch_number: Number(editForm.branch_number),
          dept_number: Number(editForm.dept_number),
          role_number: Number(editForm.role_number),
          name: editForm.name,
          surname: editForm.surname,
          birth_date: editForm.birth_date,
          salary: Number(editForm.salary),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update employee');

      setEmployees(prev =>
        prev.map(emp =>
          emp.employee_number === editForm.employee_number ? { ...emp, ...editForm, salary: Number(editForm.salary) } : emp
        )
      );
      setFilteredEmployees(prev =>
        prev.map(emp =>
          emp.employee_number === editForm.employee_number ? { ...emp, ...editForm, salary: Number(editForm.salary) } : emp
        )
      );
      setMessage({ type: 'success', text: data.message || 'Employee updated successfully' });
      cancelEdit();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  // Delete employee with confirmation
  const deleteEmployee = async employee_number => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const res = await fetch(`/api/employees?employee_number=${employee_number}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete employee (Still in hierarchy?)');

      setEmployees(prev => prev.filter(emp => emp.employee_number !== employee_number));
      setFilteredEmployees(prev => prev.filter(emp => emp.employee_number !== employee_number));
      setMessage({ type: 'success', text: data.message || 'Employee deleted successfully' });

      if (editingEmployeeNumber === employee_number) cancelEdit();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Edit / Delete Employees</h1>

      {message && (
        <p className={message.type === 'success' ? styles.message : styles.error}>
          {message.text}
        </p>
      )}

      <div className={styles.panel}>
        <label className={styles.label}>
          Search by Employee Number or Name
          <input
            type="text"
            className={styles.inputText}
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </label>

        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees found.</p>
        ) : (
          <div className={styles.resultsContainer}>
            {filteredEmployees.map(emp => (
              <div key={emp.employee_number} className={styles.itemRow}>
                {editingEmployeeNumber === emp.employee_number ? (
                  <form className={styles.editForm} onSubmit={e => { e.preventDefault(); saveEdit(); }}>
                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="employee_number">Employee Number</label>
                      <input
                        id="employee_number"
                        type="text"
                        name="employee_number"
                        value={editForm.employee_number}
                        readOnly
                        className={styles.inputText}
                        title="Employee Number (cannot be changed)"
                      />
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="branch_number">Branch</label>
                      <select
                        id="branch_number"
                        name="branch_number"
                        value={editForm.branch_number}
                        onChange={handleEditChange}
                        className={styles.inputSelect}
                        disabled={loadingDropdowns}
                      >
                        <option value="">Select branch...</option>
                        {branches.map(branch => (
                          <option key={branch.branch_id} value={branch.branch_id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="dept_number">Department</label>
                      <select
                        id="dept_number"
                        name="dept_number"
                        value={editForm.dept_number}
                        onChange={handleEditChange}
                        className={styles.inputSelect}
                        disabled={loadingDropdowns}
                      >
                        <option value="">Select department...</option>
                        {departments.map(dept => (
                          <option key={dept.dept_id} value={dept.dept_id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="role_number">Role</label>
                      <select
                        id="role_number"
                        name="role_number"
                        value={editForm.role_number}
                        onChange={handleEditChange}
                        className={styles.inputSelect}
                        disabled={loadingDropdowns}
                      >
                        <option value="">Select role...</option>
                        {roles.map(role => (
                          <option key={role.role_id} value={role.role_id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="name">Name</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className={styles.inputText}
                        placeholder="Name"
                      />
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="surname">Surname</label>
                      <input
                        id="surname"
                        type="text"
                        name="surname"
                        value={editForm.surname}
                        onChange={handleEditChange}
                        className={styles.inputText}
                        placeholder="Surname"
                      />
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="birth_date">Birth Date</label>
                      <input
                        id="birth_date"
                        type="date"
                        name="birth_date"
                        value={editForm.birth_date}
                        onChange={handleEditChange}
                        className={styles.inputDate}
                      />
                    </div>

                    <div className={styles.gridRow}>
                      <label className={styles.label} htmlFor="salary">Salary</label>
                      <input
                        id="salary"
                        type="number"
                        step="0.01"
                        name="salary"
                        value={editForm.salary}
                        onChange={handleEditChange}
                        className={styles.inputNumber}
                        placeholder="Salary"
                      />
                    </div>

                    <div className={styles.buttonRow}>
                      <button className={styles.buttonSmall} type="submit">Save</button>
                      <button className={styles.buttonSmall} type="button" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className={styles.itemText}>
                      #{emp.employee_number} — {emp.name} {emp.surname}
                    </span>
                    <button className={styles.buttonSmall} onClick={() => startEdit(emp)} type="button">
                      Edit
                    </button>
                    <button
                      className={`${styles.buttonSmall} ${styles.deleteButton}`}
                      onClick={() => deleteEmployee(emp.employee_number)}
                      type="button"
                    >
                      Delete
                    </button>
                  </>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
