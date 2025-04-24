import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import ApplyLeave from "@/pages/ApplyLeave";
import AdminDashboard from "@/pages/AdminDashboard";
import NotFound from "@/pages/NotFound";
import ProtectedRoute from "@/components/auth/protected-route";
import OAuth2RedirectHandler from "@/components/OAuth2RedirectHandler";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/employee-dashboard" element={
        <ProtectedRoute roles={["STAFF", "ADMIN"]}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/apply-leave" element={
        <ProtectedRoute roles={["STAFF", "ADMIN"]}>
          <ApplyLeave />
        </ProtectedRoute>
      } />
      
      <Route path="/admin-dashboard" element={
        <ProtectedRoute roles={["ADMIN"]}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      
      {/* Fallback routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRoutes;