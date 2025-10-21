import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DepositPage from './pages/DepositPage';
import TicketsPage from './pages/TicketsPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import DepositManagement from './pages/admin/DepositManagment';
import DrawManagement from './pages/admin/DrawManagment';
import UserManagement from './pages/admin/userManagment';
import WithdrawPage from './pages/WithdrawPage';
import WithdrawManagement from './pages/admin/WithdrawManagment';

// Loading spinner component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  return user && user.isAdmin ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* User Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DepositPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            <Route path="/withdraw" element={
            <ProtectedRoute>
              <Layout>
                <WithdrawPage />
              </Layout>
            </ProtectedRoute>
          } />

            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TicketsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="deposits" element={<DepositManagement />} />
              <Route path="draws" element={<DrawManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="withdraws" element={<WithdrawManagement/>}/>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
