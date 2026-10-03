import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const PendingApprovalPage = () => {
  const [checking, setChecking] = useState(false);
  const { user, refreshUser } = useAuth();
  const { info, success, warning } = useToast();
  const navigate = useNavigate();

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      const res = await api.get('/managers/status');
      if (res.data.status === 'APPROVED') {
        success('Congratulations! Your account has been approved.');
        await refreshUser();
        navigate('/manager/dashboard');
      } else if (res.data.status === 'REJECTED') {
        warning('Your access request was not approved by the administrator.');
      } else {
        info('Your account is still pending administrator review.');
      }
    } catch (err) {
      info('Request submitted. Waiting for administrator review.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="relative inline-flex mb-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-3xl shadow-xs">
            ⏳
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Access Request Pending</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Your email has been verified successfully. Your manager access request is now awaiting review and authorization by the system administrator.
        </p>

        <div className="my-6 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Step 1: Account Registration Complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Step 2: Email OTP Verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Step 3: Administrator Approval Pending</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Approval Status</span>
          </button>

          <Link
            to="/login"
            className="block w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
