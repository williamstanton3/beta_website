/**
 * Site footer with chapter info and quick navigation links.
 */

import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Chapter branding */}
        <div className="footer-section">
          <img src="/media/photos/Beta.png" alt="Beta Sigma crest" className="footer-crest" />
          <h3 className="footer-title">Beta Sigma</h3>
          <p className="footer-tagline">Integrity. Quality. Tradition.</p>
          <p className="footer-text">
            Est. 1922 · Grove City College
          </p>
          <p className="footer-text">Black &amp; Red · Mascot: Bulldog</p>
        </div>

        {/* Quick links mirror the main navigation */}
        <div className="footer-section">
          <h4 className="footer-heading">Explore</h4>
          <ul className="footer-links">
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/brothers">Our Brothers</Link></li>
            <li><Link to="/events">Events</Link></li>
          </ul>
        </div>

        {/* Contact details */}
        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <p className="footer-text">Grove City College</p>
          <p className="footer-text">Grove City, PA 16127</p>
          <p className="footer-text">
            <a href="mailto:gccbetasigmafrat@gmail.com">gccbetasigmafrat@gmail.com</a>
          </p>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>&copy; {currentYear} Beta Sigma Fraternity. All rights reserved.</p>
      </div>
    </footer>
  );
}
