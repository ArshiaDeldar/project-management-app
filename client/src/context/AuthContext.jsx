import { createContext, useContext, useEffect, useState } from "react";

import { apiRequest } from "../api/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check whether the user already has an active session
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const data = await apiRequest("/auth/me");

        if (isMounted) {
          setUser(data.user);
        }
      } catch (error) {
        if (error.status !== 401) {
          console.error("Authentication check failed:", error);
        }

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Register a new user
  const register = async (userData) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  };

  // Log in
  const login = async (credentials) => {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    setUser(data.user);

    return data.user;
  };

  // Log out
  const logout = async () => {
    await apiRequest("/auth/logout", {
      method: "POST",
    });

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing authentication
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
