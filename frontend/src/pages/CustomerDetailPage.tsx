import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import type { Customer } from '../api/types';
import { getCustomerByIdApi, addCustomerNoteApi } from '../api/customers';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, Plus, MessageSquare, Clock } from 'lucide-react';
import { Modal } from '../components/Modal';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAddNote = hasRole('ADMIN', 'SALES');

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getCustomerByIdApi(id);
      setCustomer(data);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !noteContent.trim()) return;

    setSubmittingNote(true);
    setError(null);
    try {
      await addCustomerNoteApi(id, noteContent.trim());
      setNoteContent('');
      setIsNoteModalOpen(false);
      fetchDetail();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add follow-up note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Customer Detail">
        <div className="p-12 text-center text-slate-400 text-sm">Loading customer profile...</div>
      </Layout>
    );
  }

  if (!customer) {
    return (
      <Layout title="Customer Not Found">
        <div className="p-12 text-center text-slate-400 text-sm">Requested customer profile was not found.</div>
      </Layout>
    );
  }

  return (
    <Layout title={`Customer Detail — ${customer.name}`}>
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers List</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={customer.status} type="customerStatus" />
              <StatusBadge status={customer.type} type="customerType" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-1">{customer.name}</h2>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-6">
              <Building className="w-4 h-4 text-slate-400" />
              <span>{customer.businessName}</span>
            </div>

            <div className="space-y-3.5 border-t border-slate-100 pt-4 text-xs">
              <div className="flex items-center gap-3 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold">{customer.mobile}</span>
              </div>

              {customer.email && (
                <div className="flex items-center gap-3 text-slate-700">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{customer.email}</span>
                </div>
              )}

              <div className="flex items-start gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{customer.address}</span>
              </div>

              {customer.gstNumber && (
                <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-400">GST Number:</span>
                  <span className="font-mono font-bold text-slate-800">{customer.gstNumber}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-400">Follow-up Date:</span>
                <span className="font-semibold text-indigo-600 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'None Scheduled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Notes Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>CRM Follow-up Notes & Interactions History</span>
                </h3>
                <p className="text-xs text-slate-500">Timeline of sales calls, meetings, and client follow-up notes.</p>
              </div>

              {canAddNote && (
                <button
                  onClick={() => setIsNoteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              )}
            </div>

            {/* Notes List */}
            {!customer.notes || customer.notes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No follow-up notes recorded for this customer yet. Click "Add Note" above to log a new interaction.
              </div>
            ) : (
              <div className="space-y-4">
                {customer.notes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {note.createdBy?.name.charAt(0) || 'U'}
                        </span>
                        <span>{note.createdBy?.name}</span>
                        <span className="text-[10px] text-slate-400">({note.createdBy?.role})</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-slate-800 font-normal leading-relaxed text-xs pl-8">{note.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Follow-up Note"
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleAddNote} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interaction / Follow-up Details *</label>
            <textarea
              required
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="e.g. Spoke with client regarding bulk order discount. Scheduled follow-up call for next Tuesday."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNoteModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingNote}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              {submittingNote ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Save Note'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};
