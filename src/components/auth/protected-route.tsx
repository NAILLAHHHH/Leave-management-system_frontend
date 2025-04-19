import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Set default headers for all requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        
        // Verify the token by getting the current user
        const response = await axios.get("/api/auth/me");
        
        if (response.data) {
          setIsAuthenticated(true);
          setUserRole(response.data.role?.roleName || "STAFF");
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
      }
    };

    checkAuth();
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-gray-200 border-r-gray-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-700">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if roles are specified
  if (roles && userRole && !roles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;