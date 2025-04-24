import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const OAuth2RedirectHandler = () => {
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    
    if (!token) {
      setError("No authentication token received");
      return;
    }
    
    // Validate the token with backend
    axios.get(`/api/auth/oauth2/token?token=${token}`)
      .then(response => {
        // Store token and user info
        localStorage.setItem("token", token);
        
        if (response.data) {
          localStorage.setItem("user", JSON.stringify({
            email: response.data.email,
            role: response.data.role
          }));
        }
        
        // Redirect to dashboard
        navigate("/dashboard");
      })
      .catch(err => {
        console.error("Failed to validate OAuth token", err);
        setError("Authentication failed. Please try again.");
      });
  }, [location, navigate]);
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 text-red-600 p-8 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Authentication Error</h2>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default OAuth2RedirectHandler;