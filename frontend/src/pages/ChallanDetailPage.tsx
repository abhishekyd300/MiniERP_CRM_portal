import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import type { Challan } from '../api/types';
import { getChallanByIdApi, confirmChallanApi, cancelChallanApi } from '../api/challans';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, Building, AlertCircle } from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canConfirm = hasRole('ADMIN', 'SALES');
  const canCancel = hasRole('ADMIN', 'SALES', 'WAREHOUSE');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getChallanByIdApi(id);
      setChallan(data);
    } catch (err) {
      console.error('Failed to load sales challan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleConfirm = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await confirmChallanApi(id);
      setChallan(res);
      setSuccessMessage(`Challan ${res.challanNumber} has been CONFIRMED successfully! Stock has been deducted.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm sales challan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await cancelChallanApi(id);
      setChallan(res);
      setSuccessMessage(`Challan ${res.challanNumber} has been CANCELLED.`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel sales challan.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Challan Detail">
        <div className="p-12 text-center text-slate-400 text-sm">Loading sales challan detail...</div>
      </Layout>
    );
  }

  if (!challan) {
    return (
      <Layout title="Challan Not Found">
        <div className="p-12 text-center text-slate-400 text-sm">Requested sales challan was not found.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Sales Challan — ${challan.challanNumber}`}>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/challans"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Challans List</span>
        </Link>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-extrabold font-mono text-indigo-600 tracking-tight">
                {challan.challanNumber}
              </h2>
              <StatusBadge status={challan.status} type="challanStatus" />
            </div>
            <p className="text-xs text-slate-500">
              Created on {new Date(challan.createdAt).toLocaleString()} by{' '}
              <strong className="text-slate-700">{challan.createdBy?.name}</strong> ({challan.createdBy?.role})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {challan.status === 'DRAFT' && canConfirm && (
              <button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionLoading ? 'Processing...' : 'Confirm & Deduct Stock'}</span>
              </button>
            )}

            {challan.status !== 'CANCELLED' && canCancel && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-rose-700 font-semibold text-xs hover:bg-rose-50 hover:border-rose-200 border border-slate-200 transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{actionLoading ? 'Processing...' : 'Cancel Challan'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Customer Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Customer Account</div>
            <div className="font-bold text-slate-900 text-sm mb-0.5">{challan.customer?.name}</div>
            <div className="text-slate-500 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{challan.customer?.businessName}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-semibold text-slate-400 uppercase mb-1">Contact Details</div>
            <div className="font-semibold text-slate-800">{challan.customer?.mobile}</div>
            <div className="text-slate-500 truncate">{challan.customer?.email || 'No email provided'}</div>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="text-[11px] font-semibold text-indigo-400 uppercase mb-1">Order Summary</div>
            <div className="text-xl font-extrabold text-indigo-900">
              ₹{challan.totalAmount ? challan.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-xs font-semibold text-indigo-600 mt-0.5">{challan.totalQuantity} Total Units</div>
          </div>
        </div>
      </div>

      {/* Snapshot Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Challan Line Items (Historical Price Snapshots)</h3>
          <p className="text-xs text-slate-500">
            Items, SKUs, and unit prices captured at the exact moment of challan draft creation.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-4">Item #</th>
                <th className="py-3.5 px-4">Product Name (Snapshot)</th>
                <th className="py-3.5 px-4">SKU (Snapshot)</th>
                <th className="py-3.5 px-4">Snapshot Price</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {challan.items.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-4 px-4 font-bold text-slate-900">{item.productNameSnapshot}</td>
                  <td className="py-4 px-4 font-mono font-semibold text-slate-700">{item.skuSnapshot}</td>
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    ₹{item.priceSnapshot.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-4 font-bold text-indigo-600">{item.quantity} units</td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900">
                    ₹{(item.quantity * item.priceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};
