import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, requiredRole, children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== requiredRole) {
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
}

export default ProtectedRoute;
