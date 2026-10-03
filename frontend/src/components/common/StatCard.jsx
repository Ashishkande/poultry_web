import React from 'react';

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald', // emerald, amber, red, blue, slate
  trend,
  trendType = 'up', // up, down, neutral
}) => {
  const variantStyles = {
    emerald: {
      bg: 'bg-emerald-500/10 text-emerald-600',
      border: 'border-slate-200/80 hover:border-emerald-300',
      valueColor: 'text-slate-900',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-600',
      border: 'border-slate-200/80 hover:border-amber-300',
      valueColor: 'text-slate-900',
    },
    red: {
      bg: 'bg-rose-500/10 text-rose-600',
      border: 'border-slate-200/80 hover:border-rose-300',
      valueColor: 'text-rose-600',
    },
    blue: {
      bg: 'bg-sky-500/10 text-sky-600',
      border: 'border-slate-200/80 hover:border-sky-300',
      valueColor: 'text-slate-900',
    },
    slate: {
      bg: 'bg-slate-500/10 text-slate-700',
      border: 'border-slate-200/80 hover:border-slate-300',
      valueColor: 'text-slate-900',
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.emerald;

  return (
    <div
      className={`bg-white rounded-2xl p-6 border ${currentVariant.border} shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 tracking-tight ${currentVariant.valueColor}`}>
            {value}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${currentVariant.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-semibold ${
                trendType === 'down'
                  ? 'text-emerald-600'
                  : trendType === 'up'
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
