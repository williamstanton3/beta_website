/**
 * Shared layout for all admin pages.
 * Renders the admin top nav bar and the page content below it.
 * Used by every admin page component so they don't repeat the nav markup.
 */

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const ADMIN_NAV = [
  { to: "/admin",                label: "Dashboard",     end: true },
  { to: "/admin/members",        label: "Members" },
  { to: "/admin/events",         label: "Events" },
  { to: "/admin/announcements",  label: "News" },
  { to: "/admin/gallery",        label: "Gallery" },
  { to: "/admin/pledge-classes", label: "Pledge Classes" },
  { to: "/admin/rush",           label: "Rush" },
  { to: "/admin/donate",         label: "Donate" },
  { to: "/admin/contact",        label: "Contact" },
  { to: "/admin/messages",       label: "Messages" },
];

export default function AdminLayout({ title, children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="admin-shell">
      {/* Admin top bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          {/* Wordmark */}
          <span className="admin-topbar-brand">
            <span className="admin-brand-sym">ΒΣ</span> Admin Panel
          </span>

          {/* Section links */}
          <nav className="admin-nav">
            {ADMIN_NAV.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="admin-topbar-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-view-site-btn">
              View Site ↗
            </a>
            <button onClick={handleLogout} className="admin-logout-btn">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Page body */}
      <main className="admin-body">
        <div className="admin-page-title">
          <h1>{title}</h1>
        </div>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
