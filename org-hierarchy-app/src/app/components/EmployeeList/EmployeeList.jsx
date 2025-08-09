'use client';

import React, { useState, useEffect } from 'react';
import styles from './EmployeeList.module.css';

export default function EmployeeList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

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

  // Filter states
  const [filters, setFilters] = useState({
    branch: '',
    department: '',
    role: '',
    salaryMin: '',
    salaryMax: '',
    birthDateFrom: '',
    birthDateTo: '',
  });

  const [showFilters, setShowFilters] = useState(false);

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

  // Enhanced filtering logic
  useEffect(() => {
    let filtered = employees;

    // Text search filter
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(emp =>
        emp.employee_number.toString().includes(term) ||
        emp.name.toLowerCase().includes(term) ||
        emp.surname.toLowerCase().includes(term)
      );
    }

    // Branch filter
    if (filters.branch) {
      filtered = filtered.filter(emp => emp.branch_number === parseInt(filters.branch));
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(emp => emp.dept_number === parseInt(filters.department));
    }

    // Role filter
    if (filters.role) {
      filtered = filtered.filter(emp => emp.role_number === parseInt(filters.role));
    }

    // Salary range filter
    if (filters.salaryMin) {
      filtered = filtered.filter(emp => emp.salary >= parseFloat(filters.salaryMin));
    }
    if (filters.salaryMax) {
      filtered = filtered.filter(emp => emp.salary <= parseFloat(filters.salaryMax));
    }

    // Birth date range filter
    if (filters.birthDateFrom) {
      filtered = filtered.filter(emp => new Date(emp.birth_date) >= new Date(filters.birthDateFrom));
    }
    if (filters.birthDateTo) {
      filtered = filtered.filter(emp => new Date(emp.birth_date) <= new Date(filters.birthDateTo));
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, employees, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      branch: '',
      department: '',
      role: '',
      salaryMin: '',
      salaryMax: '',
      birthDateFrom: '',
      birthDateTo: '',
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (filters.branch) count++;
    if (filters.department) count++;
    if (filters.role) count++;
    if (filters.salaryMin) count++;
    if (filters.salaryMax) count++;
    if (filters.birthDateFrom) count++;
    if (filters.birthDateTo) count++;
    return count;
  };

  const startEdit = emp => {
    setEditingEmployeeNumber(emp.employee_number);
    setEditForm({
      employee_number: emp.employee_number,
      branch_number: emp.branch_number,
      dept_number: emp.dept_number,
      role_number: emp.role_number,
      name: emp.name,
      surname: emp.surname,
      birth_date: emp.birth_date.slice(0, 10),
      salary: emp.salary,
    });
    setMessage(null);
  };

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

  const saveEdit = async () => {
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
          employee_number: editForm.employee_number,
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

  // Helper function to get name by ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branch_id === branchId);
    return branch ? branch.name : 'Unknown';
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.dept_id === deptId);
    return dept ? dept.name : 'Unknown';
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.name : 'Unknown';
  };

  return (
    <>
    <div className={styles.page}>
      <h1 className={styles.heading}>Edit / Delete Employees</h1>

      {message && (
        <p className={message.type === 'success' ? styles.message : styles.error}>
          {message.text}
        </p>
      )}

      <div className={styles.panel}>
        {/* Search Section */}
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

        {/* Filter Toggle */}
        <div className={styles.filterToggle}>
          <button
            className={styles.buttonSmall}
            onClick={() => setShowFilters(!showFilters)}
            type="button"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {getActiveFilterCount() > 0 && ` (${getActiveFilterCount()} active)`}
          </button>
          {getActiveFilterCount() > 0 && (
            <button
              className={`${styles.buttonSmall} ${styles.clearButton}`}
              onClick={clearAllFilters}
              type="button"
            >
              Clear All Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className={styles.filtersPanel}>
            <h3 className={styles.filtersHeading}>Filter Options</h3>
            
            <div className={styles.filtersGrid}>
              {/* Branch Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Branch</label>
                <select
                  className={styles.inputSelect}
                  value={filters.branch}
                  onChange={e => handleFilterChange('branch', e.target.value)}
                  disabled={loadingDropdowns}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Department</label>
                <select
                  className={styles.inputSelect}
                  value={filters.department}
                  onChange={e => handleFilterChange('department', e.target.value)}
                  disabled={loadingDropdowns}
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept.dept_id} value={dept.dept_id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Role</label>
                <select
                  className={styles.inputSelect}
                  value={filters.role}
                  onChange={e => handleFilterChange('role', e.target.value)}
                  disabled={loadingDropdowns}
                >
                  <option value="">All Roles</option>
                  {roles.map(role => (
                    <option key={role.role_id} value={role.role_id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Range Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Salary Range</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="number"
                    className={styles.inputNumber}
                    placeholder="Min salary"
                    value={filters.salaryMin}
                    onChange={e => handleFilterChange('salaryMin', e.target.value)}
                  />
                  <span className={styles.rangeSeparator}>to</span>
                  <input
                    type="number"
                    className={styles.inputNumber}
                    placeholder="Max salary"
                    value={filters.salaryMax}
                    onChange={e => handleFilterChange('salaryMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Birth Date Range Filter */}
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Birth Date Range</label>
                <div className={styles.rangeInputs}>
                  <input
                    type="date"
                    className={styles.inputDate}
                    value={filters.birthDateFrom}
                    onChange={e => handleFilterChange('birthDateFrom', e.target.value)}
                  />
                  <span className={styles.rangeSeparator}>to</span>
                  <input
                    type="date"
                    className={styles.inputDate}
                    value={filters.birthDateTo}
                    onChange={e => handleFilterChange('birthDateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Results Info */}
        <div className={styles.resultsInfo}>
          <p>Showing {filteredEmployees.length} of {employees.length} employees</p>
        </div>

        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p>No employees found matching your criteria.</p>
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
                    <div className={styles.employeeInfo}>
                      <span className={styles.itemText}>
                        #{emp.employee_number} — {emp.name} {emp.surname}
                      </span>
                      <div className={styles.employeeDetails}>
                        <span className={styles.detailItem}>
                          Branch: {getBranchName(emp.branch_number)}
                        </span>
                        <span className={styles.detailItem}>
                          Dept: {getDepartmentName(emp.dept_number)}
                        </span>
                        <span className={styles.detailItem}>
                          Role: {getRoleName(emp.role_number)}
                        </span>
                        <span className={styles.detailItem}>
                          Salary: ${emp.salary?.toLocaleString()}
                        </span>
                        <span className={styles.detailItem}>
                          DOB: {new Date(emp.birth_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className={styles.actionButtons}>
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
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}