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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      <div className="max-w-5xl mx-auto bg-[var(--foreground)] text-[var(--text)] shadow-md rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Employee Directory</h1>

        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Loading employees...</p>
        ) : employees.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">No employees found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white text-left">
                  <th className="px-4 py-2">Employee #</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Surname</th>
                  <th className="px-4 py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employee_number} className="border-t dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-2">{emp.employee_number}</td>
                    <td className="px-4 py-2">{emp.name}</td>
                    <td className="px-4 py-2">{emp.surname}</td>
                    <td className="px-4 py-2">{emp.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
