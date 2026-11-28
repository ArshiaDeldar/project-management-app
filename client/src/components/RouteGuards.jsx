import { Navigate } from "react-router";

import { useAuth } from "../context/AuthContext.jsx";

// Only authenticated users can access these routes
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Authenticated users shouldn't need to see login/register pages
export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <p>Checking authentication...</p>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
