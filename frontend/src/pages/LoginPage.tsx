import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, LogIn, Lock, Mail, ShieldAlert } from 'lucide-react';
import type { Role } from '../api/types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
    setLoading(true);
    try {
      await login({ email: roleEmail, password: rolePass });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { name: 'Admin User', role: 'ADMIN' as Role, email: 'admin@minicrm.com', pass: 'Admin@123', bg: 'hover:border-blue-500 hover:bg-blue-50/80 text-blue-700 border-sky-100 bg-white/80' },
    { name: 'Sales Rep', role: 'SALES' as Role, email: 'sales@minicrm.com', pass: 'Sales@123', bg: 'hover:border-teal-500 hover:bg-teal-50/80 text-teal-700 border-sky-100 bg-white/80' },
    { name: 'Warehouse Mgr', role: 'WAREHOUSE' as Role, email: 'warehouse@minicrm.com', pass: 'Warehouse@123', bg: 'hover:border-amber-500 hover:bg-amber-50/80 text-amber-700 border-sky-100 bg-white/80' },
    { name: 'Accounts Officer', role: 'ACCOUNTS' as Role, email: 'accounts@minicrm.com', pass: 'Accounts@123', bg: 'hover:border-indigo-500 hover:bg-indigo-50/80 text-indigo-700 border-sky-100 bg-white/80' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Light Bluish Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-300/40 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Crisp Light Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-blue-100 p-8 rounded-3xl shadow-xl shadow-blue-500/10">
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Mini ERP + CRM</h2>
              <p className="text-xs text-blue-600 font-semibold mt-1">Enterprise Management Portal</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center mb-6">
            Sign in to access your role-based CRM & ERP workspace.
          </p>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-50/80 border border-blue-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/80 border border-blue-100 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 focus:ring-4 focus:ring-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Grid */}
          <div className="mt-8 pt-6 border-t border-blue-100/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Quick Demo Login (4 Roles)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => quickLogin(acc.email, acc.pass)}
                  className={`p-2.5 rounded-xl border text-left transition-all duration-150 shadow-xs ${acc.bg}`}
                >
                  <div className="text-[11px] font-bold">{acc.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{acc.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
