import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PigManagement from './pages/PigManagement';
import PigDetail from './pages/PigDetail';
import Genealogy from './pages/Genealogy';
import VaccinationManagement from './pages/VaccinationManagement';
import TreatmentManagement from './pages/TreatmentManagement';
import WeightTracking from './pages/WeightTracking';
import SalesManagement from './pages/SalesManagement';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

// Components
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard" /> :
              <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pigs"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <PigManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pigs/:rfidId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <PigDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/genealogy"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Genealogy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vaccinations"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <VaccinationManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treatments"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <TreatmentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/weights"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <WeightTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <SalesManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredRole="admin">
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
