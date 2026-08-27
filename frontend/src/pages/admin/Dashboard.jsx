/**
 * Admin dashboard — landing page after login.
 * Shows cards linking to each section of the admin panel.
 */

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

// Dashboard cards — one per managed content area
const SECTIONS = [
  { to: "/admin/members",       icon: "👥", label: "Members",       desc: "Add, edit, or remove brothers and their headshots" },
  { to: "/admin/events",        icon: "📅", label: "Events",         desc: "Create and manage upcoming chapter events" },
  { to: "/admin/announcements", icon: "📢", label: "Announcements",  desc: "Post news and featured announcements" },
  { to: "/admin/gallery",       icon: "🖼️",  label: "Gallery",        desc: "Upload chapter photos and videos" },
  { to: "/admin/pledge-classes",icon: "🎓", label: "Pledge Classes", desc: "Manage photos for each pledge class year" },
  { to: "/admin/rush",          icon: "🤝", label: "Rush Page",      desc: "Edit rush/recruitment page content sections" },
  { to: "/admin/donate",        icon: "💛", label: "Donate Page",    desc: "Edit donation content and payment link" },
  { to: "/admin/contact",       icon: "✉️",  label: "Contact Page",   desc: "Edit the president's name and email" },
  { to: "/admin/messages",      icon: "📬", label: "Messages",       desc: "View submissions from the Contact page form" },
];

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <AdminLayout title="Dashboard">
      <p className="admin-dashboard-welcome">
        Welcome back! What would you like to manage today?
      </p>

      <div className="admin-dashboard-grid">
        {SECTIONS.map(({ to, icon, label, desc }) => (
          <Link key={to} to={to} className="admin-dash-card">
            <span className="admin-dash-icon">{icon}</span>
            <h3>{label}</h3>
            <p>{desc}</p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
}
