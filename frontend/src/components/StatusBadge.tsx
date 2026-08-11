import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'role' | 'customerStatus' | 'customerType' | 'challanStatus' | 'stockStatus' | 'movementType';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'customerStatus' }) => {
  let styleClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'role') {
    switch (status) {
      case 'ADMIN':
        styleClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
        break;
      case 'SALES':
        styleClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
        break;
      case 'WAREHOUSE':
        styleClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
        break;
      case 'ACCOUNTS':
        styleClass = 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
        break;
    }
  } else if (type === 'customerStatus') {
    switch (status) {
      case 'ACTIVE':
        styleClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'LEAD':
        styleClass = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'INACTIVE':
        styleClass = 'bg-slate-100 text-slate-600 border-slate-300';
        break;
    }
  } else if (type === 'customerType') {
    switch (status) {
      case 'WHOLESALE':
        styleClass = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'DISTRIBUTOR':
        styleClass = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'RETAIL':
        styleClass = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
    }
  } else if (type === 'challanStatus') {
    switch (status) {
      case 'CONFIRMED':
        styleClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
        break;
      case 'DRAFT':
        styleClass = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
        break;
      case 'CANCELLED':
        styleClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
        break;
    }
  } else if (type === 'stockStatus') {
    if (status === 'LOW_STOCK') {
      styleClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium animate-pulse';
    } else {
      styleClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  } else if (type === 'movementType') {
    if (status === 'IN') {
      styleClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
    } else {
      styleClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styleClass}`}
    >
      {status === 'LOW_STOCK' ? '⚠️ Low Stock' : status}
    </span>
  );
};
