import { useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../context/AuthContext.jsx";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState("");

  const handleLogout = async () => {
    setError("");

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="dashboard-page">
      <div>
        <p className="brand">PROJECTFLOW</p>

        <h1>Welcome, {user.name}!</h1>

        <p>
          You're successfully authenticated. Your dashboard will be built here.
        </p>

        {error && <p className="form-error">{error}</p>}

        <button onClick={handleLogout}>Log out</button>
      </div>
    </main>
  );
};

export default DashboardPage;
