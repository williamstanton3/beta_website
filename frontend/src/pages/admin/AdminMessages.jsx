/**
 * Admin Messages page — view and delete contact form submissions from the
 * public Contact page. Read-only aside from deleting handled messages.
 */

import { Fragment, useEffect, useState } from "react";
import { adminGetMessages, adminDeleteMessage } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminMessages() {
  const { token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setMessages(await adminGetMessages(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(msg) {
    if (!window.confirm(`Delete the message from ${msg.name}?`)) return;
    try { await adminDeleteMessage(msg.id, token); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <AdminLayout title="Contact Messages">
      <p className="admin-dashboard-welcome">
        Submissions from the public Contact page form.
      </p>

      {loading && <p className="admin-loading">Loading messages...</p>}
      {error && (
        <p className="form-error">
          {error}{" "}
          <button type="button" className="admin-edit-btn" onClick={logout}>Log in again</button>
        </p>
      )}
      {!loading && !error && messages.length === 0 && (
        <p className="admin-hint">No messages yet.</p>
      )}
      {!loading && !error && messages.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Received</th><th>From</th><th>Subject</th><th>Actions</th></tr></thead>
            <tbody>
              {messages.map(msg => (
                <Fragment key={msg.id}>
                  <tr>
                    <td>{formatDate(msg.submitted_at)}</td>
                    <td>{msg.name}<br /><span className="admin-hint">{msg.email}</span></td>
                    <td>{msg.subject}</td>
                    <td className="admin-row-actions">
                      <button
                        className="admin-edit-btn"
                        onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      >
                        {expandedId === msg.id ? "Hide" : "View"}
                      </button>
                      <button className="admin-delete-btn" onClick={() => handleDelete(msg)}>Delete</button>
                    </td>
                  </tr>
                  {expandedId === msg.id && (
                    <tr>
                      <td colSpan={4} style={{ whiteSpace: "pre-wrap" }}>{msg.message}</td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
