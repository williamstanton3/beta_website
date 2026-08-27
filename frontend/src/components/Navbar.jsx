/**
 * Public site navigation bar.
 * Highlights the active page and collapses into a mobile menu on small screens.
 */

import { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_LINKS = [
  { to: "/",        label: "Home",     end: true },
  { to: "/about",   label: "About" },
  { to: "/brothers",label: "Brothers" },
  { to: "/events",  label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/donate",  label: "Donate" },
  { to: "/contact", label: "Contact" },
  { to: "/admin",   label: "Admin",    admin: true },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <NavLink to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          <img src="/media/photos/Beta2.png" alt="Beta Sigma crest" className="brand-crest" />
          <span className="brand-text">Beta Sigma</span>
        </NavLink>

        <button
          className="navbar-toggle"
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>

        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {NAV_LINKS.map(({ to, label, end, admin }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                admin
                  ? isActive ? "nav-link nav-link-admin active" : "nav-link nav-link-admin"
                  : isActive ? "nav-link active" : "nav-link"
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
