'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './EmployeeList.module.css';

// Searchable dropdown component
const SearchableDropdown = ({ options, onSelect, placeholder, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const filtered = options.filter(option => {
      const searchLower = searchTerm.toLowerCase();
      return (
        option.employee_number.toString().includes(searchLower) ||
        option.name.toLowerCase().includes(searchLower) ||
        option.surname.toLowerCase().includes(searchLower) ||
        `${option.name} ${option.surname}`.toLowerCase().includes(searchLower)
      );
    });
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    onSelect(option.employee_number);
    setSearchTerm('');
    setIsOpen(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      e.preventDefault();
      handleSelect(filteredOptions[0]);
    }
  };

  return (
    <div className={`${styles.searchableDropdown} ${className || ''}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        autoComplete="off"
      />
      {isOpen && (
        <div className={styles.dropdownList}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.employee_number}
                className={styles.dropdownItem}
                onClick={() => handleSelect(option)}
              >
                #{option.employee_number} - {option.name} {option.surname}
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              {searchTerm ? 'No employees found' : 'Type to search employees...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  const [hierarchyData, setHierarchyData] = useState([]);
  const [subordinates, setSubordinates] = useState({});
  const [availableEmployees, setAvailableEmployees] = useState([]);

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
    async function fetchHierarchy() {
      try {
        const res = await fetch('/api/hierarchy');
        if (res.ok) {
          const data = await res.json();
          setHierarchyData(data);
          
          const subMap = {};
          data.forEach(({ manager_id, employee_id }) => {
            if (!subMap[manager_id]) {
              subMap[manager_id] = [];
            }
            subMap[manager_id].push(employee_id);
          });
          setSubordinates(subMap);
        }
      } catch (err) {
        console.error('Error fetching hierarchy:', err);
      }
    }
    fetchHierarchy();
  }, []);

  useEffect(() => {
    if (editingEmployeeNumber) {
      const currentSubs = subordinates[editingEmployeeNumber] || [];
      const reportingChain = getReportingChain(editingEmployeeNumber);
      
      const available = employees.filter(emp => 
        emp.employee_number !== editingEmployeeNumber && 
        !currentSubs.includes(emp.employee_number) &&
        !reportingChain.includes(emp.employee_number)
      );
      setAvailableEmployees(available);
    }
  }, [editingEmployeeNumber, employees, subordinates]);

  const getReportingChain = (employeeId) => {
    const chain = [];
    const visited = new Set();
    let current = employeeId;
    
    while (current && !visited.has(current)) {
      visited.add(current);
      const manager = hierarchyData.find(h => h.employee_id === current);
      if (manager) {
        chain.push(manager.manager_id);
        current = manager.manager_id;
      } else {
        break;
      }
    }
    
    return chain;
  };

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

  // Hierarchy management functions
  const addSubordinate = async (managerId, subordinateId) => {
    try {
      const res = await fetch('/api/hierarchy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: subordinateId,
          manager_id: managerId,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add subordinate');
      }
      
      const hierarchyRes = await fetch('/api/hierarchy');
      if (hierarchyRes.ok) {
        const data = await hierarchyRes.json();
        setHierarchyData(data);
        
        const subMap = {};
        data.forEach(({ manager_id, employee_id }) => {
          if (!subMap[manager_id]) {
            subMap[manager_id] = [];
          }
          subMap[manager_id].push(employee_id);
        });
        setSubordinates(subMap);
      }
      
      setMessage({ type: 'success', text: 'Subordinate added successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const removeSubordinate = async (managerId, subordinateId) => {
    try {
      const res = await fetch('/api/hierarchy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: subordinateId,
          manager_id: managerId,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to remove subordinate');
      }
      
      const hierarchyRes = await fetch('/api/hierarchy');
      if (hierarchyRes.ok) {
        const data = await hierarchyRes.json();
        setHierarchyData(data);
        
        const subMap = {};
        data.forEach(({ manager_id, employee_id }) => {
          if (!subMap[manager_id]) {
            subMap[manager_id] = [];
          }
          subMap[manager_id].push(employee_id);
        });
        setSubordinates(subMap);
      }
      
      setMessage({ type: 'success', text: 'Subordinate removed successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

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

  const getEmployeeName = (empId) => {
    const emp = employees.find(e => e.employee_number === empId);
    return emp ? `${emp.name} ${emp.surname}` : `Employee ${empId}`;
  };

  return (
    <>
    <div className={styles.page}>
      <h1 className={styles.heading}>Edit / Delete Employees & Manage Hierarchy</h1>

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

                    {/* Hierarchy Management Section */}
                    <div className={styles.hierarchySection}>
                      <h4 className={styles.hierarchyHeading}>Manages</h4>
                      <div className={styles.currentSubordinates}>
                        {(subordinates[emp.employee_number] || []).length > 0 ? (
                          subordinates[emp.employee_number].map(subId => (
                            <div key={subId} className={styles.subordinateItem}>
                              <span>#{subId} - {getEmployeeName(subId)}</span>
                              <button
                                type="button"
                                className={`${styles.buttonSmall} ${styles.removeSubordinateButton}`}
                                onClick={() => removeSubordinate(emp.employee_number, subId)}
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className={styles.noSubordinates}>No direct reports</p>
                        )}
                      </div>
                      <div className={styles.addSubordinate}>
                        <SearchableDropdown
                          options={availableEmployees}
                          onSelect={(employeeId) => addSubordinate(emp.employee_number, employeeId)}
                          placeholder="Search and add employee to report to this person..."
                        />
                      </div>
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
                        {subordinates[emp.employee_number] && subordinates[emp.employee_number].length > 0 && (
                          <span className={styles.detailItem}>
                            Manages: {subordinates[emp.employee_number].length} employee{subordinates[emp.employee_number].length !== 1 ? 's' : ''}
                          </span>
                        )}
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