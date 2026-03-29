import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ExpenseForm from './pages/ExpenseForm';
import ExpenseHistory from './pages/ExpenseHistory';
import ApprovalDashboard from './pages/ApprovalDashboard';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout>
                <Navigate to="/dashboard" replace />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/expenses/new" element={
            <ProtectedRoute>
              <AppLayout>
                <ExpenseForm />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/expenses/history" element={
            <ProtectedRoute>
              <AppLayout>
                <ExpenseHistory />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute roles={['Admin', 'Manager']}>
              <AppLayout>
                <ApprovalDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute roles={['Admin']}>
              <AppLayout>
                <AdminPanel />
              </AppLayout>
            </ProtectedRoute>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
