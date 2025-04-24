import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import axios from "axios";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth redirect and query params
  useEffect(() => {
    // Check if this is a redirect from OAuth with a token
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    
    if (token) {
      // Validate the token with the backend
      axios.get(`/api/auth/oauth2/token?token=${token}`)
        .then(response => {
          // Store the token in localStorage
          localStorage.setItem("token", response.data.token);
          
          // If user data is returned, you can also store that
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
          setError("Failed to authenticate with Microsoft account");
          console.error("OAuth token validation failed", err);
        });
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Call the login API endpoint
      const response = await axios.post("/api/auth/login", {
        email: formData.email,
        password: formData.password
      });
      
      // Store the token in localStorage
      localStorage.setItem("token", response.data.token);
      
      // If user data is returned, you can also store that
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      // Handle errors
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = () => {
    setIsLoading(true);
    // Redirect to backend endpoint that initiates Microsoft OAuth flow
    window.location.href = "oauth2/authorization/microsoft";
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Enter your email to sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  placeholder="name@ist.com"
                  type="email"
                  className="pl-9"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-9 pr-9"
                  required
                  value={formData.password}
                  onChange={handleChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button 
              className="w-full bg-[#0EA5E9] hover:bg-[#0EA5E9]/90" 
              type="submit" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M0 0h11.5v11.5H0V0zm12.5 0H24v11.5H12.5V0zM0 12.5h11.5V24H0V12.5zm12.5 0H24V24H12.5V12.5z"/>
              </svg>
              Sign in with Microsoft
            </Button>
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#0EA5E9] hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}