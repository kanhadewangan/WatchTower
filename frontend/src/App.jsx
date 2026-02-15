import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Monitoring from './pages/Monitoring';
import Hero from './pages/Hero';
import { useState,useEffect } from 'react';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log(!!token);
    setIsAuthenticated(!!token);
  }, []);
  return (
    <Router>
      <div className="App">
        <Routes>
          {isAuthenticated ? (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/monitor" element={<Monitoring />} />
              <Route path="/monitor/:websitename" element={<MonitoringDashboard />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Hero />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
          <Route path="/" element={<Hero/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitor" element= {<Monitoring />} />
          <Route path="/monitor/:websitename" element={<MonitoringDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;