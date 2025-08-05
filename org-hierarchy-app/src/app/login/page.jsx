'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        //set 
        const token = localStorage.setItem('token', 'your-auth-token'); // Replace with actual token from response
        router.push('/');
      } else {
        const data = await res.json();
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-md border"
        style={{
          background: 'var(--foreground)',
          color: 'var(--foreground)',
          borderColor: 'rgba(0, 57, 131, 1)',
          boxShadow: '0 2px 8px rgba(255, 255, 255, 1)',
        }}
      >
        <h2 className="text-2xl font-bold text-center mb-6">
          Login to your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.15)',
                color: '#222',
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{
                borderColor: 'rgba(0, 0, 0, 0.15)',
                color: '#222',
              }}
              required
            />
          </div>

          <div className="flex justify-between text-sm text-gray-400">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Remember me
            </label>
            <a href="#" className="text-blue-500 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg font-medium transition-colors"
            style={{
              background: '#2858a5ff',
              color: '#fff',
            }}
          >
            Login
          </button>

          {error && (
            <p className="text-red-500 text-sm text-center mt-2">{error}</p>
          )}
        </form>

        <p className="mt-6 text-sm text-center text-gray-400">
          Don’t have an account?
          <br />
          Request access by contacting your manager.
        </p>
      </div>
    </div>
  );
}
