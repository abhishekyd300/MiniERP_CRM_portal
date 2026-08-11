import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCustomersApi } from '../api/customers';
import { getProductsApi } from '../api/products';
import { getChallansApi } from '../api/challans';
import type { Challan } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    lowStockCount: 0,
    draftChallans: 0,
  });
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [customersRes, productsRes, lowStockRes, challansRes] = await Promise.all([
          getCustomersApi({ limit: 1 }),
          getProductsApi({ limit: 1 }),
          getProductsApi({ lowStock: true, limit: 100 }),
          getChallansApi({ limit: 5 }),
        ]);

        const draftCountRes = await getChallansApi({ status: 'DRAFT', limit: 1 });

        setStats({
          totalCustomers: customersRes.pagination.total,
          totalProducts: productsRes.pagination.total,
          lowStockCount: lowStockRes.pagination.total,
          draftChallans: draftCountRes.pagination.total,
        });

        setRecentChallans(challansRes.challans);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total CRM Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      link: '/customers',
    },
    {
      title: 'Products Catalog',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      link: '/products',
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockCount,
      icon: AlertTriangle,
      color: stats.lowStockCount > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100',
      link: '/products?lowStock=true',
    },
    {
      title: 'Pending Draft Challans',
      value: stats.draftChallans,
      icon: FileText,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      link: '/challans?status=DRAFT',
    },
  ];

  return (
    <Layout title="Enterprise Overview Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active Session: {user?.role} Role</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Monitor real-time CRM customer leads, product stock thresholds, and sales challan fulfillment workflows from your central management console.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-3 rounded-xl border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold text-slate-900 tracking-tight">
                  {loading ? '...' : card.value}
                </span>
                <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Sales Challans</h3>
            <p className="text-xs text-slate-500">Latest delivery challans generated across the portal.</p>
          </div>
          <Link
            to="/challans"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            View All Challans <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading recent challans...</div>
        ) : recentChallans.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No sales challans created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Challan No.</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Total Qty</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentChallans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{c.challanNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {c.customer?.name} <span className="text-slate-400 text-[11px]">({c.customer?.businessName})</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{c.totalQuantity} items</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{c.totalAmount ? c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} type="challanStatus" />
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/challans/${c.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};
