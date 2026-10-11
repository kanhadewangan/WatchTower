import { BrowserRouter as Router, Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "./hooks/IsAuthenticate";
import Dashboard from "./pages/Dashboard";
import Monitoring from "./pages/Monitoring";
import MonitoringDashboard from "./pages/MonitoringDashboard";
import Hero from "./pages/Hero";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Legal from "./pages/Legal";

// Create QueryClient instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/terms" element={<Legal page="terms" />} />
          <Route path="/privacy" element={<Legal page="privacy" />} />
          <Route path="/security" element={<Legal page="security" />} />

          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />

          <Route
            path="/monitor"
            element={<ProtectedRoute><Monitoring /></ProtectedRoute>}
          />

          <Route
            path="/monitor/:websitename"
            element={<ProtectedRoute><MonitoringDashboard /></ProtectedRoute>}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;