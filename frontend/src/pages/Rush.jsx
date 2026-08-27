/**
 * Rush page — recruitment information loaded from /api/rush.
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchRushInfo } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function Rush() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRushInfo();
  }, []);

  async function loadRushInfo() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRushInfo();
      setSections(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page rush-page">
      {/* Attention-grabbing rush hero */}
      <section className="rush-hero">
        <div className="container">
          <h1>Rush Beta Sigma</h1>
          <p>
            Interested in joining a brotherhood built on integrity, quality, and
            tradition at Grove City College? Rush is your chance to see if Beta Sigma is the right fit.
          </p>
          <Link to="/contact" className="btn btn-primary">
            Ask a Question
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <LoadingSpinner message="Loading rush information..." />}
          {error && <ErrorMessage message={error} onRetry={loadRushInfo} />}

          {!loading && !error && (
            <div className="rush-grid">
              {sections.map((section, index) => (
                <article key={section.id} className="rush-card">
                  <span className="rush-step">{index + 1}</span>
                  <h2>{section.section_title}</h2>
                  <p>{section.section_content}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom call-to-action */}
      <section className="section rush-cta">
        <div className="container rush-cta-inner">
          <h2>Ready to Take the Next Step?</h2>
          <p>
            Attend a rush event, introduce yourself, and learn what it means
            to wear the navy and gold.
          </p>
          <Link to="/events" className="btn btn-outline">
            View Rush Events
          </Link>
        </div>
      </section>
    </div>
  );
}
