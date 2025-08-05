// src/app/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        setEmployees(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Employee Directory</h1>
      {loading && <p>Loading employees...</p>}
      {!loading && employees.length === 0 && <p>No employees found.</p>}
      <ul>
        {employees.map(emp => (
          <li key={emp.employee_number}>
            {emp.name} {emp.surname} — {emp.role}
          </li>
        ))}
      </ul>
    </main>
  );
}
