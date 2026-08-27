/**
 * ProtectedRoute — wraps any route that requires an admin login.
 *
 * If the user is not authenticated (no valid token in localStorage)
 * they are redirected to /admin/login. The original URL is passed as
 * `?from=` so the login page can redirect back after success.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Remember where the user was trying to go
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}
