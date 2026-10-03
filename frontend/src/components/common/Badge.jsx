import React from 'react';

const Badge = ({ status = '', text, size = 'sm' }) => {
  const normStatus = (status || text || '').toUpperCase();

  const colorMap = {
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    PENDING_ADMIN_APPROVAL: 'bg-amber-100 text-amber-800 border-amber-200',
    PENDING_VERIFICATION: 'bg-amber-100 text-amber-800 border-amber-200',
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    MAINTENANCE: 'bg-amber-100 text-amber-800 border-amber-200',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
    DISABLED: 'bg-slate-200 text-slate-700 border-slate-300',
    INACTIVE: 'bg-slate-200 text-slate-700 border-slate-300',
    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
    MANAGER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  const style = colorMap[normStatus] || 'bg-slate-100 text-slate-800 border-slate-200';
  const sizeStyle = size === 'xs' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const label = text || normStatus.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeStyle} ${style}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {label}
    </span>
  );
};

export default Badge;
