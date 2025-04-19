import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: {
    id: number;
    roleName: string;
  };
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Try to load user from localStorage first
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse stored user data");
      }
    }
    
    // Then fetch fresh user data from API
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        console.log("Backend user response:", response.data);
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (error) {
        console.error("Failed to fetch user data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigateToEmployeeDashboard = () => {
    navigate('/employee-dashboard');
  };

  const navigateToAdminDashboard = () => {
    navigate('/admin-dashboard');
  };

  const navigateToApplyLeave = () => {
    navigate('/apply-leave');
  };

  const isAdmin = user?.role?.roleName === "ADMIN";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Leave Management System
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Welcome, {user?.firstName || 'User'}!
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium mb-4">Dashboard</h2>
          <p className="text-gray-600">
            Welcome to the leave management system. Use the links below to navigate to different sections.
          </p>
          
          {user && (
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Your Profile</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>{" "}
                  {user.firstName} {user.lastName}
                </div>
                <div>
                  <span className="text-gray-500">Email:</span> {user.email}
                </div>
                <div>
                  <span className="text-gray-500">Role:</span>{" "}
                  {user.role?.roleName || 'N/A'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Dashboard</CardTitle>
              <CardDescription>View your leave balances and history</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Access your personal dashboard to view leave balances, apply for leave, and check request status.
              </p>
              <Button onClick={navigateToEmployeeDashboard} className="w-full">
                Go to Employee Dashboard
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Apply for Leave</CardTitle>
              <CardDescription>Request time off</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Submit a new leave request for approval. You can choose from various leave types.
              </p>
              <Button onClick={navigateToApplyLeave} className="w-full">
                Apply for Leave
              </Button>
            </CardContent>
          </Card>
          
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Manage leaves and employees</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Access the admin panel to manage leave approvals, employees, and system settings.
                </p>
                <Button onClick={navigateToAdminDashboard} className="w-full">
                  Go to Admin Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;