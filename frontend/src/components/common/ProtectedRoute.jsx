import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" message="Loading Poultry Portal..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Manager specific status checks
  if (user.role === 'MANAGER') {
    if (!user.email_verified) {
      return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
    }
    if (user.status === 'PENDING_ADMIN_APPROVAL') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (user.status === 'REJECTED' || user.status === 'DISABLED') {
      return <Navigate to="/login" replace />;
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to respective dashboard if role not allowed
    const target = user.role === 'ADMIN' ? '/admin/dashboard' : '/manager/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
};

export default ProtectedRoute;
