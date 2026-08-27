/**
 * Events page — lists upcoming and past chapter events from /api/events.
 */

import { useEffect, useState } from "react";
import { fetchEvents } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Split events into upcoming vs. past using today's date (midnight local)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.filter(
    (e) => new Date(e.event_date) >= today
  );
  const past = events.filter(
    (e) => new Date(e.event_date) < today
  );

  return (
    <div className="page events-page">
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>Chapter Events</h1>
            <p className="page-header-subtitle">
              Social, Service, Alumni, and more.
            </p>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <LoadingSpinner message="Loading events..." />}
          {error && <ErrorMessage message={error} onRetry={loadEvents} />}

          {!loading && !error && (
            <>
              <EventList title="Upcoming Events" events={upcoming} emptyMessage="No upcoming events scheduled." />
              <EventList title="Past Events" events={past} emptyMessage="No past events to display." past />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Reusable event list section.
 */
function EventList({ title, events, emptyMessage, past = false }) {
  return (
    <div className={`event-list-section ${past ? "past-events" : ""}`}>
      <h2 className="section-title">{title}</h2>

      {events.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <article key={event.id} className="event-card">
              <time className="event-date" dateTime={event.event_date}>
                {formatEventDate(event.event_date)}
              </time>
              <h3>{event.title}</h3>
              <p className="event-location">{event.location}</p>
              <p className="event-description">{event.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/** Format date for event cards (e.g. "Saturday, August 25, 2026"). */
function formatEventDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
