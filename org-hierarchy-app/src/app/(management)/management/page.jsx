'use client';

import React from 'react';
import Link from 'next/link';
import { FaUserPlus, FaEdit, FaUsersCog, FaBuilding, FaSitemap } from 'react-icons/fa';
import styles from './management.module.css';

const managementItems = [
  { label: 'Add Employee', href: '/employees/add', icon: <FaUserPlus /> },
  { label: 'Edit / Delete Employees', href: '/employees/edit', icon: <FaEdit /> },
  { label: 'Manage Branches', href: '/branches', icon: <FaBuilding /> },
  { label: 'Manage Departments', href: '/departments', icon: <FaSitemap /> },
  { label: 'Manage Roles', href: '/roles', icon: <FaUsersCog /> },
];

export default function ManagementDashboard() {
  return (
    <main className={styles.page}>
      <h1 className={styles.heading}>Management Dashboard</h1>

      <div className={styles.tilesGrid}>
        {managementItems.map(({ label, href, icon }) => (
          <Link key={href} href={href} className={styles.tile}>
            <div className={styles.tileContent}>
              <div className={styles.iconWrapper}>{icon}</div>
              <span className={styles.tileLabel}>{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
