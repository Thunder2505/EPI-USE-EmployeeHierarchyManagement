'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import crypto from 'crypto';

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [gravatarUrl, setGravatarUrl] = useState('');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('session_token');
    const email = localStorage.getItem('user_email');
    setIsLoggedIn(!!token);

    if (email) {
      const hashEmail = email.trim().toLowerCase();
      const hash = crypto.createHash('sha256').update(hashEmail).digest('hex');
      setGravatarUrl(`https://0.gravatar.com/avatar/${hash}`);
    }

    const syncToken = () => {
      const updatedToken = localStorage.getItem('session_token');
      setIsLoggedIn(!!updatedToken);
    };

    window.addEventListener('login', syncToken);
    window.addEventListener('logout', syncToken);

    return () => {
      window.removeEventListener('login', syncToken);
      window.removeEventListener('logout', syncToken);
    };
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('session_token');
    window.dispatchEvent(new Event('logout'));
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <header
      className="text-white p-4 shadow-md flex items-center justify-between"
      style={{
        background: 'var(--foreground)',
        color: 'var(--text)',
      }}
    >
      {/* Logo & Title */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          {/* Light mode logo */}
          <div className="block dark:hidden">
            <Image
              src="/images/logo-light.png"
              alt="Logo (Light Mode)"
              width={180}
              height={80}
              priority
            />
          </div>

          {/* Dark mode logo */}
          <div className="hidden dark:block">
            <Image
              src="/images/logo-dark.png"
              alt="Logo (Dark Mode)"
              width={180}
              height={80}
              priority
            />
          </div>
        </Link>
        <h1 className="text-xl font-bold ml-4">Employee Hierarchy Manager</h1>
      </div>

      {/* Profile + Logout */}
      {isLoggedIn && (
        <div className="flex items-center space-x-4">
          {/* Profile badge */}
          <Link href="/profile">
            <img
              src={gravatarUrl || '/images/default-avatar.png'}
              alt="Profile"
              className="w-10 h-10 rounded-full border border-white hover:opacity-80 transition-opacity cursor-pointer"
            />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
