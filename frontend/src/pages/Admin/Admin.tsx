import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLogin from '../../components/AdminLogin/AdminLogin';
import AdminDashboard from '../../components/AdminDashboard/AdminDashboard';

const Admin: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => {}} />;
  }

  return <AdminDashboard />;
};

export default Admin;
