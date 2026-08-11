import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import type { Challan, Customer, Product } from '../api/types';
import { getChallansApi, createChallanApi } from '../api/challans';
import { getCustomersApi } from '../api/customers';
import { getProductsApi } from '../api/products';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Eye, ChevronLeft, ChevronRight, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChallansPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = hasRole('ADMIN', 'SALES');

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const data = await getChallansApi({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setChallans(data.challans);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [pagination.page, statusFilter]);

  const openCreateModal = async () => {
    try {
      const [custData, prodData] = await Promise.all([
        getCustomersApi({ limit: 100 }),
        getProductsApi({ limit: 100 }),
      ]);
      setCustomers(custData.customers);
      setAvailableProducts(prodData.products);

      if (custData.customers.length > 0) {
        setSelectedCustomerId(custData.customers[0].id);
      }
      setLineItems([{ productId: prodData.products[0]?.id || '', quantity: 1 }]);
      setFormError(null);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Failed to load customer/product options:', err);
    }
  };

  const addLineItem = () => {
    if (availableProducts.length === 0) return;
    setLineItems([...lineItems, { productId: availableProducts[0].id, quantity: 1 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, key: 'productId' | 'quantity', value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [key]: value };
    setLineItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    const validItems = lineItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Please add at least one line item with a valid product and quantity.');
      return;
    }

    try {
      await createChallanApi({
        customerId: selectedCustomerId,
        items: validItems,
      });
      setIsModalOpen(false);
      fetchChallans();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create sales challan draft.');
    }
  };

  return (
    <Layout title="Sales Challans Management (ERP)">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Sales Delivery Challans</h3>
          <p className="text-xs text-slate-500">Draft delivery notes, atomic stock deductions, and historical price snapshots.</p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Draft Challan</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={(e) => { e.preventDefault(); fetchChallans(); }} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challan number or customer name..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="w-full sm:w-44 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-medium"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading sales challans...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No sales challans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-4">Challan Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Count</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {challans.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-indigo-600 text-sm">
                      {c.challanNumber}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{c.customer?.name}</div>
                      <div className="text-slate-500 text-[11px]">{c.customer?.businessName}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {c.totalQuantity} items
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      ₹{c.totalAmount ? c.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={c.status} type="challanStatus" />
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/challans/${c.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-xs hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage & Confirm</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500">
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total challans)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Draft Challan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Draft Sales Challan"
        maxWidth="max-w-2xl"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold text-slate-800"
            >
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.businessName}) — {cust.mobile}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Challan Line Items (Product Snapshot Preview)</span>
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Line
              </button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto p-1">
              {lineItems.map((item, index) => {
                const selectedProd = availableProducts.find((p) => p.id === item.productId);
                return (
                  <div key={index} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <div className="flex-1">
                      <select
                        value={item.productId}
                        onChange={(e) => updateLineItem(index, 'productId', e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                      >
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku}) — ₹{p.unitPrice} [Stock: {p.currentStock}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-slate-800">
                      ₹{selectedProd ? (selectedProd.unitPrice * item.quantity).toFixed(2) : '0.00'}
                    </div>

                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              Save Draft Challan
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
