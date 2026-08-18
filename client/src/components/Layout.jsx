import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/inventory', label: 'Inventory' },
  { to: '/orders', label: 'Orders' },
  { to: '/picking', label: 'Picking' },
  { to: '/exceptions', label: 'Exceptions' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/ai-analysis', label: '🤖 AI Analysis' }
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>📦 Smart Warehouse</h2>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'active' : ''}>
            {item.label}
          </NavLink>
        ))}
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}