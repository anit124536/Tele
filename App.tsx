
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './pages/Admin/AdminLayout';
import UserLayout from './pages/User/UserLayout';
import AdminLogin from './pages/Admin/AdminLogin';

const App: React.FC = () => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('admin_session') === 'active';
  });

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    localStorage.setItem('admin_session', 'active');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('admin_session');
  };

  return (
    <HashRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            isAdminAuthenticated ? 
            <AdminLayout onLogout={handleAdminLogout} /> : 
            <Navigate to="/admin/login" replace />
          } 
        />
        
        <Route 
          path="/admin/login" 
          element={
            isAdminAuthenticated ? 
            <Navigate to="/admin" replace /> : 
            <AdminLogin onLogin={handleAdminLogin} />
          } 
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
