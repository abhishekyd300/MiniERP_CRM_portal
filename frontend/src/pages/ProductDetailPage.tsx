import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import type { Product, StockMovement } from '../api/types';
import { getProductByIdApi, getProductMovementsApi } from '../api/products';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, MapPin, Tag, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [prodData, moveData] = await Promise.all([
          getProductByIdApi(id),
          getProductMovementsApi(id),
        ]);
        setProduct(prodData);
        setMovements(moveData);
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <Layout title="Product Detail Audit">
        <div className="p-12 text-center text-slate-400 text-sm">Loading product & audit logs...</div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout title="Product Not Found">
        <div className="p-12 text-center text-slate-400 text-sm">Requested product was not found in catalog.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Product Audit — ${product.name}`}>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Products Catalog</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Overview Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                {product.sku}
              </span>
              {product.isLowStock && <StatusBadge status="LOW_STOCK" type="stockStatus" />}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">{product.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-6">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>{product.category}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 mb-6 flex justify-between items-center">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Unit Price</div>
                <div className="text-xl font-extrabold text-slate-900">
                  ₹{product.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-400 uppercase">Stock Level</div>
                <div className={`text-xl font-extrabold ${product.isLowStock ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {product.currentStock} units
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Min Stock Alert:</span>
                <span className="font-semibold text-slate-800">{product.minStockAlert} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Warehouse Location:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {product.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Movement Audit Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Stock Movement Audit Log History</span>
              </h3>
              <p className="text-xs text-slate-500">Immutable ledger of manual stock adjustments and challan deductions.</p>
            </div>

            {movements.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No stock movement events recorded for this product yet.
              </div>
            ) : (
              <div className="space-y-3">
                {movements.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                          m.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {m.type === 'IN' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{m.reason}</span>
                          <StatusBadge status={m.type} type="movementType" />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          By <strong className="text-slate-600">{m.createdBy?.name}</strong> ({m.createdBy?.role}) on{' '}
                          {new Date(m.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-base font-extrabold ${m.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantityChanged} units
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
