import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navigation.css';

function Navigation({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="navigation">
      <div className="nav-header">
        <h2>🐷 Pig Farm</h2>
        <div className="nav-user">
          {user?.fullName} ({user?.role})
        </div>
      </div>

      <ul className="nav-menu">
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/pigs">Pig Management</Link></li>
        <li><Link to="/genealogy">Genealogy</Link></li>
        <li><Link to="/vaccinations">Vaccinations</Link></li>
        <li><Link to="/treatments">Treatments</Link></li>
        <li><Link to="/weights">Weight Tracking</Link></li>
        <li><Link to="/sales">Sales</Link></li>
        <li><Link to="/reports">Reports</Link></li>
        {user?.role === 'admin' && (
          <li><Link to="/users">User Management</Link></li>
        )}
      </ul>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}

export default Navigation;
