/**
 * Brothers page — active members by pledge class, followed by an alumni section.
 */

import { useEffect, useState } from "react";
import { fetchMembersByPledgeClass } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";

export default function Brothers() {
  const [pledgeClasses, setPledgeClasses] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [alumniOpen, setAlumniOpen]       = useState(false);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    try {
      setLoading(true); setError(null);
      setPledgeClasses(await fetchMembersByPledgeClass());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const activeClasses = pledgeClasses.filter(g => g.member_type === "active");
  const alumniClasses = pledgeClasses.filter(g => g.member_type === "alumni");

  return (
    <div className="page brothers-page">
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>Our Brothers</h1>
            <p className="page-header-subtitle">
              30+ active members at Grove City College, organized by pledge class.
            </p>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <LoadingSpinner message="Loading brothers..." />}
          {error   && <ErrorMessage message={error} onRetry={loadMembers} />}

          {!loading && !error && (
            <>
              {/* ── Active Brothers ─────────────────────────────────────── */}
              {activeClasses.map(group => (
                <PledgeClassGroup key={group.year} group={group} />
              ))}

              {/* ── Alumni ──────────────────────────────────────────────── */}
              {alumniClasses.length > 0 && (
                <div className="alumni-section">
                  <button
                    className="alumni-toggle"
                    onClick={() => setAlumniOpen(o => !o)}
                    aria-expanded={alumniOpen}
                  >
                    <span>Alumni</span>
                    <span className="alumni-toggle-icon">{alumniOpen ? "▲" : "▼"}</span>
                  </button>

                  {alumniOpen && (
                    <div className="alumni-classes">
                      {alumniClasses.map(group => (
                        <PledgeClassGroup key={group.year} group={group} alumni />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function PledgeClassGroup({ group, alumni = false }) {
  return (
    <div className={`pledge-class-section ${alumni ? "alumni-pledge-class" : ""}`}>
      <h2 className="pledge-class-heading">Class of {group.year}</h2>
      <div className="members-grid">
        {group.members.map(member => (
          <article
            key={`${member.first_name}-${member.last_name}`}
            className="member-card"
          >
            <div className="member-avatar">
              {member.image_url ? (
                <img
                  src={member.image_url}
                  alt={`${member.first_name} ${member.last_name}`}
                />
              ) : (
                <span>{member.first_name[0]}{member.last_name[0]}</span>
              )}
            </div>

            <div className="member-info">
              <h3>{member.first_name} {member.last_name}</h3>
              {member.major    && <p className="member-meta">{member.major}</p>}
              {member.hometown && <p className="member-meta">{member.hometown}</p>}
              {member.roles && member.roles.length > 0 && (
                <div className="member-roles">
                  {member.roles.map(role => (
                    <span key={role} className="member-role">{role}</span>
                  ))}
                </div>
              )}
              {member.bio && <p className="member-bio">{member.bio}</p>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
