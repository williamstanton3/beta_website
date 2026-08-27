/**
 * Authentication context for the Beta Sigma admin panel.
 *
 * Stores the JWT token in localStorage so officers stay logged in
 * after a browser refresh. Provides login/logout helpers and an
 * isAuthenticated flag consumed by ProtectedRoute and admin pages.
 *
 * Usage:
 *   const { token, login, logout, isAuthenticated } = useAuth();
 */

import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "bs_admin_token";

export function AuthProvider({ children }) {
  // Initialise from localStorage so the session survives page refreshes
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));

  /**
   * Save a fresh JWT token after a successful login response.
   * @param {string} newToken
   */
  function login(newToken) {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  }

  /**
   * Clear the token from state and storage, effectively ending the session.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — use inside any component that needs auth state. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
