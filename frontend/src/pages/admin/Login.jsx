/**
 * Admin login page.
 * Officers enter the chapter admin password to receive a JWT token
 * that grants access to all admin pages for 8 hours.
 */

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminLogin } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to wherever the officer was trying to go (or dashboard)
  const from = location.state?.from?.pathname || "/admin";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { token } = await adminLogin(password);
      login(token);              // store token in context + localStorage
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Chapter branding */}
        <div className="admin-login-header">
          <div className="admin-brand-symbol">ΒΣ</div>
          <h1>Beta Sigma</h1>
          <p>Officer Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="password">Admin Password</label>
            <input
              id="password"
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="admin-login-footer">
          Not an officer?{" "}
          <a href="/" style={{ color: "var(--gold)" }}>Return to website</a>
        </p>
      </div>
    </div>
  );
}
