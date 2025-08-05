'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const token = localStorage.getItem('session_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Validate token with backend
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,  // Optional, if your backend requires auth header
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          // Token invalid or expired
          localStorage.removeItem('session_token');
          router.push('/login');
          return;
        }

        const sessionData = await res.json();

        const now = new Date();
        const expiryDate = new Date(sessionData.expiry); // ISO string from backend

        if (expiryDate <= now) {
          // Token expired
          localStorage.removeItem('session_token');
          router.push('/login');
          return;
        }

        // Token valid — fetch employees
        const employeesRes = await fetch('/api/employees');
        if (!employeesRes.ok) {
          setLoading(false);
          return;
        }
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        router.push('/login');  // Redirect on error just in case
      }
    };

    checkSessionAndFetch();
  }, [router]);

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
