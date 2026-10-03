import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Mail, CheckCircle2, RotateCcw, ArrowRight, ShieldAlert } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { useToast } from '../../context/ToastContext';

const VerifyOtpPage = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes (300s)
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value && element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toastError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, fullOtp);
      toastSuccess('Email Verified Successfully');
      setVerifiedSuccess(true);
      setTimeout(() => {
        navigate('/pending-approval');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP.';
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toastError('Email address is missing.');
      return;
    }

    setResending(true);
    try {
      await authService.resendOtp(email);
      toastSuccess('A new OTP has been sent to your email.');
      setTimer(300);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend OTP.';
      toastError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 items-center justify-center text-3xl mb-4 shadow-xs">
          ✉️
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Your Email</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          We sent a 6-digit OTP code to: <br />
          <strong className="text-slate-800">{email || 'your registered email'}</strong>
        </p>

        {verifiedSuccess ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
            <h3 className="font-bold text-base">Email Verified Successfully</h3>
            <p className="text-xs text-emerald-700 mt-1">
              Redirecting to Administrator Approval Status...
            </p>
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 text-center text-2xl font-extrabold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-600 shadow-xs"
                />
              ))}
            </div>

            {/* Countdown timer & resend */}
            <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
              <span>
                {timer > 0 ? (
                  <>Expires in: <strong className="text-emerald-700">{formatTimer(timer)}</strong></>
                ) : (
                  <span className="text-rose-600 font-semibold">OTP Expired. Please request a new OTP.</span>
                )}
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || timer > 240}
                className="font-bold text-emerald-700 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {loading ? <span>Verifying OTP...</span> : <span>Verify & Continue</span>}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
