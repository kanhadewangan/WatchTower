import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./hooks/IsAuthenticate";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import Hero from "./pages/Hero";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Create QueryClient instance
const queryClient = new QueryClient();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              localStorage.getItem("token")
                ? <Dashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/monitor"
            element={
              localStorage.getItem("token")
                ? <Monitoring />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/monitor/:websitename"
            element={
              localStorage.getItem("token")
                ? <MonitoringDashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;