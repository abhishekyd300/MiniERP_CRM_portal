import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import type { Product } from '../api/types';
import { getProductsApi, createProductApi, updateProductApi, adjustStockApi, type CreateProductPayload } from '../api/products';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Edit2, Eye, ChevronLeft, ChevronRight, AlertTriangle, ArrowUpDown, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProductsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductPayload>({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: '',
  });

  // Stock Adjust Modal State
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockFormData, setStockFormData] = useState<{ quantityChanged: number; type: 'IN' | 'OUT'; reason: string }>({
    quantityChanged: 1,
    type: 'IN',
    reason: '',
  });

  const [formError, setFormError] = useState<string | null>(null);

  const canEdit = hasRole('ADMIN', 'WAREHOUSE');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProductsApi({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        lowStock: lowStockFilter || undefined,
      });
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Failed to fetch product catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, lowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 5,
      location: '',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      minStockAlert: product.minStockAlert,
      location: product.location,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openStockModal = (product: Product) => {
    setStockProduct(product);
    setStockFormData({
      quantityChanged: 1,
      type: 'IN',
      reason: 'Manual Stock Adjustment',
    });
    setFormError(null);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProductApi(editingProduct.id, formData);
      } else {
        await createProductApi(formData);
      }
      setIsCreateModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to save product details.');
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    setFormError(null);
    try {
      await adjustStockApi(stockProduct.id, stockFormData);
      setStockProduct(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to adjust product stock.');
    }
  };

  return (
    <Layout title="Product & Inventory Catalog (ERP)">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Products Catalog & Stock Control</h3>
          <p className="text-xs text-slate-500">Manage SKUs, warehouse stock levels, min alert thresholds, and pricing.</p>
        </div>
        {canEdit && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, or category..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
          />
        </form>

        <button
          type="button"
          onClick={() => {
            setLowStockFilter(!lowStockFilter);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
            lowStockFilter
              ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          <span>Low Stock Filter {lowStockFilter ? '(Active)' : ''}</span>
        </button>
      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden mb-6">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading product catalog...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No product items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-4">Product Name & Category</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Unit Price</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.isLowStock && <StatusBadge status="LOW_STOCK" type="stockStatus" />}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">{p.category}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-slate-700">{p.sku}</td>
                    <td className="py-4 px-4 font-bold text-slate-900">
                      ₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-sm font-extrabold ${p.isLowStock ? 'text-rose-600' : 'text-slate-800'}`}>
                          {p.currentStock}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">/ Min {p.minStockAlert}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{p.location}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <Link
                        to={`/products/${p.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Audit Log</span>
                      </Link>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => openStockModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold text-xs hover:bg-amber-100 transition-colors"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                            <span>Adjust Stock</span>
                          </button>

                          <button
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </>
                      )}
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
            Showing Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total items)
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingProduct ? 'Edit Product Catalog Entry' : 'Add New Product Item'}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Industrial Bearing 6205-ZZ"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SKU Number *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. BRG-6205-ZZ"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Hardware Components"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.unitPrice || ''}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                placeholder="450.00"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {!editingProduct && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Stock Level</label>
                <input
                  type="number"
                  min="0"
                  value={formData.currentStock || 0}
                  onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Stock Alert Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minStockAlert || 5}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Warehouse Location *</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Rack A-12"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              {editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={!!stockProduct}
        onClose={() => setStockProduct(null)}
        title={`Adjust Stock — ${stockProduct?.name}`}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
            <span>Current Available Stock:</span>
            <strong className="text-sm text-indigo-600">{stockProduct?.currentStock} units</strong>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Adjustment Type *</label>
              <select
                value={stockFormData.type}
                onChange={(e) => setStockFormData({ ...stockFormData, type: e.target.value as 'IN' | 'OUT' })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold"
              >
                <option value="IN">IN (+) Add Stock</option>
                <option value="OUT">OUT (-) Deduct Stock</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                value={stockFormData.quantityChanged}
                onChange={(e) => setStockFormData({ ...stockFormData, quantityChanged: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Adjustment Reason *</label>
            <input
              type="text"
              required
              value={stockFormData.reason}
              onChange={(e) => setStockFormData({ ...stockFormData, reason: e.target.value })}
              placeholder="e.g. Received new shipment / Damaged stock write-off"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setStockProduct(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
            >
              Confirm Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
