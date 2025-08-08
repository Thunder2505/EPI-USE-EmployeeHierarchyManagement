'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeTree from './components/EmployeeTree';

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

      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          localStorage.removeItem('session_token');
          router.push('/login');
          return;
        }

        const sessionData = await res.json();
        const now = new Date();
        const expiryDate = new Date(sessionData.expiry);

        if (expiryDate <= now) {
          localStorage.removeItem('session_token');
          router.push('/login');
          return;
        }

        // ✅ Fetch employees after session is valid
        const empRes = await fetch('/api/employees');
        const empData = await empRes.json();
        setEmployees(empData);
        setLoading(false);

      } catch (error) {
        setLoading(false);
        router.push('/login');
      }
    };

    checkSessionAndFetch();
  }, [router]);

  return (
    <>
      <title>Employee Hierarchy</title>
      <main className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-3xl font-bold text-center mb-8">Employee Hierarchy</h1>
        <EmployeeTree />
      </main>
    </>
  );
}
