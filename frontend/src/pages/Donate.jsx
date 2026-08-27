/**
 * Public Donate page — content driven by the admin panel.
 * Officers edit the headline, payment link, and impact
 * bullets through /admin/donate without redeploying the site.
 */

import { useEffect, useState } from "react";
import { fetchDonateInfo } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function Donate() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonateInfo()
      .then(setInfo)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><LoadingSpinner message="Loading..." /></div>;
  if (error || !info) return <div className="page"><ErrorMessage message={error || "Could not load donation info."} /></div>;

  const pct = info.goal_amount ? Math.min(100, Math.round((0 / info.goal_amount) * 100)) : null;

  return (
    <div className="page donate-page">
      {/* Header — matches the standard inner-page header (About, Events, etc.) */}
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>{info.headline}</h1>
            <a
              href={info.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary donate-cta-btn"
            >
              {info.payment_button_text} →
            </a>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      {/* Impact bullets */}
      <section className="section">
        <div className="container donate-body">
          <div className="donate-impact">
            <h2>Your Impact</h2>
            <ul className="donate-bullets">
              {info.impact_bullets.map((b, i) => (
                <li key={i}><span className="donate-bullet-icon">✦</span>{b}</li>
              ))}
            </ul>
          </div>

          {/* Fundraising goal widget (optional) */}
          {info.goal_amount > 0 && (
            <div className="donate-goal-card">
              <h3>Academic Year Fundraising Goal</h3>
              <div className="donate-goal-bar-wrap">
                <div className="donate-goal-bar" style={{ width: `${pct}%` }} />
              </div>
              <p className="donate-goal-label">
                ${(0).toLocaleString()} raised of ${info.goal_amount.toLocaleString()} goal
              </p>
            </div>
          )}

          {/* Final CTA */}
          <div className="donate-final-cta">
            <h2>Make a Difference Today</h2>
            <p>
              Beta Sigma brothers are future leaders in every field. Your support
              helps them get there.
            </p>
            <a
              href={info.payment_link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              {info.payment_button_text}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
