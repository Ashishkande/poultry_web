import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public / Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManagersPage from './pages/admin/ManagersPage';
import AdminFarmsPage from './pages/admin/AdminFarmsPage';
import AdminBatchesPage from './pages/admin/AdminBatchesPage';
import AdminMortalityPage from './pages/admin/AdminMortalityPage';
import ReportsPage from './pages/admin/ReportsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';

// Manager Pages
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import AddMortalityPage from './pages/manager/AddMortalityPage';
import ManagerFarmsPage from './pages/manager/ManagerFarmsPage';
import ManagerBatchesPage from './pages/manager/ManagerBatchesPage';
import ManagerMortalityHistoryPage from './pages/manager/ManagerMortalityHistoryPage';
import ManagerReportsPage from './pages/manager/ManagerReportsPage';
import ManagerProfilePage from './pages/manager/ManagerProfilePage';

// Root redirect handler
const RootRedirect = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/manager/dashboard" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-email" element={<VerifyOtpPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />

              {/* Admin Protected Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="managers" element={<ManagersPage />} />
                <Route path="farms" element={<AdminFarmsPage />} />
                <Route path="batches" element={<AdminBatchesPage />} />
                <Route path="mortality" element={<AdminMortalityPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Manager Protected Routes */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="dashboard" element={<ManagerDashboardPage />} />
                <Route path="mortality/add" element={<AddMortalityPage />} />
                <Route path="farms" element={<ManagerFarmsPage />} />
                <Route path="batches" element={<ManagerBatchesPage />} />
                <Route path="mortality" element={<ManagerMortalityHistoryPage />} />
                <Route path="reports" element={<ManagerReportsPage />} />
                <Route path="profile" element={<ManagerProfilePage />} />
              </Route>

              {/* Default Root Fallback */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
