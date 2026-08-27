/**
 * Home page — hero section, featured announcements, and quick links.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAnnouncements } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load featured announcements when the page mounts
  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAnnouncements(true);
      setAnnouncements(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page home-page">
      {/* Hero banner with primary call-to-action */}
      <section className="hero">
        <div className="hero-overlay" />
        <img src="/media/photos/Beta.png" alt="" aria-hidden="true" className="hero-crest-watermark" />
        <div className="container hero-content">
          <p className="hero-eyebrow">Est. 1922 · Grove City College</p>
          <h1 className="hero-title">Beta Sigma Fraternity</h1>
          <p className="hero-subtitle">
            Integrity. Quality. Tradition.
          </p>
        </div>
      </section>

      {/* Chapter at-a-glance stats */}
      <section className="section stats-section">
        <div className="container stats-grid">
          <div className="stat-card">
            <span className="stat-number">1922</span>
            <span className="stat-label">Founded</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">30+</span>
            <span className="stat-label">Active Members</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">800+</span>
            <span className="stat-label">Alumni</span>
          </div>
          <div className="stat-card">
            <img src="/media/photos/Beta Dog.jpg" alt="Beta Sigma Bulldog" className="stat-icon-img" />
            <span className="stat-label">Mascot: Bulldog</span>
          </div>
        </div>
      </section>


      {/* Featured news from the API */}
      <section className="section announcements-section">
        <div className="container">
          <h2 className="section-title">Latest News</h2>

          {loading && <LoadingSpinner message="Loading announcements..." />}
          {error && (
            <ErrorMessage message={error} onRetry={loadAnnouncements} />
          )}

          {!loading && !error && (
            <div className="announcements-grid">
              {announcements.map((item) => (
                <article key={item.id} className="announcement-card">
                  <time className="announcement-date" dateTime={item.posted_at}>
                    {formatDate(item.posted_at)}
                  </time>
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quick navigation cards */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-section-header">
            <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="cta-section-crest" />
          </div>
        </div>
        <div className="container cta-grid">
          <Link to="/brothers" className="cta-card">
            <h3>Meet the Brothers</h3>
            <p>30+ active members led by our executive board.</p>
            <span className="cta-arrow">→</span>
          </Link>
          <Link to="/events" className="cta-card">
            <h3>Upcoming Events</h3>
            <p>Philanthropy, socials, and brotherhood retreats.</p>
            <span className="cta-arrow">→</span>
          </Link>
          <Link to="/contact" className="cta-card">
            <h3>Get in Touch</h3>
            <p>Questions about the chapter? Reach out.</p>
            <span className="cta-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

/** Format an ISO date string for display (e.g. "June 18, 2026"). */
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
