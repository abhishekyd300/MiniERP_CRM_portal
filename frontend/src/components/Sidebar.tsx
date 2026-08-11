import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FileText,
  LogOut,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Customers CRM', path: '/customers', icon: Users },
    { name: 'Products Catalog', path: '/products', icon: Package },
    { name: 'Sales Challans', path: '/challans', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white tracking-tight leading-none text-base">Mini ERP+CRM</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Enterprise Portal</p>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <div className="mx-4 my-5 p-3.5 rounded-xl bg-slate-800/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate mb-1">{user.email}</p>
              <StatusBadge status={user.role} type="role" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Role Capabilities Indicator */}
      <div className="px-4 py-3 mx-4 mb-3 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Role Access</span>
        </div>
        <p className="leading-snug">
          Logged in as <strong className="text-indigo-300">{user?.role}</strong>. Capabilities enforced per business rules.
        </p>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 border border-transparent transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
