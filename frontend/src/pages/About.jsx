/**
 * About page — chapter history, motto, values, and philanthropy.
 * Content is loaded from the /api/about endpoint.
 */

import { useEffect, useState } from "react";
import { fetchChapterInfo } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function About() {
  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChapterInfo();
  }, []);

  async function loadChapterInfo() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchChapterInfo();
      setChapter(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <LoadingSpinner message="Loading chapter history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorMessage message={error} onRetry={loadChapterInfo} />
      </div>
    );
  }

  return (
    <div className="page about-page">
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>About {chapter.name}</h1>
            <p className="page-header-subtitle">
              Founded {chapter.founded}
            </p>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      <section className="section">
        <div className="container about-grid">
          <div className="about-main">
            <h2 className="section-title">Our History</h2>
            <p className="about-history">{chapter.history}</p>

            <h2 className="section-title">Philanthropy</h2>
            <p>{chapter.philanthropy}</p>
          </div>

          <aside className="about-sidebar">
            <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="about-sidebar-crest" />
            <div className="fact-card">
              <h3>Campus</h3>
              <p className="fact-highlight">{chapter.campus}</p>
            </div>

            <div className="fact-card">
              <h3>Size</h3>
              <p className="fact-highlight">{chapter.active_members} active members</p>
              <p className="fact-sub">{chapter.alumni_count} alumni</p>
            </div>

            <div className="fact-card">
              <h3>Mascot</h3>
              <div className="mascot-card-inner">
                <img
                  src="/media/photos/Beta Dog.jpg"
                  alt="Beta Sigma Bulldog mascot"
                  className="mascot-img"
                />
                <p className="fact-highlight">{chapter.mascot}</p>
              </div>
            </div>

            <div className="fact-card">
              <h3>Motto</h3>
              <p className="fact-highlight">{chapter.motto}</p>
            </div>

          </aside>
        </div>
      </section>
    </div>
  );
}
