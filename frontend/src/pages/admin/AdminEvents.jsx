/**
 * Admin Events page — create, edit, and delete chapter events.
 */

import { useEffect, useState } from "react";
import { adminGetEvents, adminCreateEvent, adminUpdateEvent, adminDeleteEvent } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

const EMPTY_FORM = { title: "", description: "", event_date: "", location: "" };

export default function AdminEvents() {
  const { token, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEvents(await adminGetEvents(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setSaveError(null); setShowForm(true);
  }
  function openEdit(ev) {
    setEditingId(ev.id);
    setForm({ title: ev.title, description: ev.description, event_date: ev.event_date, location: ev.location });
    setSaveError(null); setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      if (editingId) await adminUpdateEvent(editingId, form, token);
      else await adminCreateEvent(form, token);
      setShowForm(false); load();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(ev) {
    if (!window.confirm(`Delete event "${ev.title}"?`)) return;
    try { await adminDeleteEvent(ev.id, token); load(); }
    catch (err) { alert(err.message); }
  }

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <AdminLayout title="Events">
      <div className="admin-action-bar">
        <button className="btn btn-primary" onClick={openCreate}>+ Add Event</button>
        {showForm && <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2 className="admin-form-title">{editingId ? "Edit Event" : "Add New Event"}</h2>
          <div className="admin-form-grid">
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Event Title *</label>
              <input required value={form.title} onChange={f("title")} placeholder="Event name" />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input required type="date" value={form.event_date} onChange={f("event_date")} />
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Location *</label>
              <input required value={form.location} onChange={f("location")} placeholder="Where is it?" />
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Description *</label>
              <textarea required rows={4} value={form.description} onChange={f("description")} placeholder="Describe the event..." />
            </div>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Event"}
          </button>
        </form>
      )}

      {loading && <p className="admin-loading">Loading events...</p>}
      {error && (
        <p className="form-error">
          {error}{" "}
          <button type="button" className="admin-edit-btn" onClick={logout}>Log in again</button>
        </p>
      )}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.event_date}</td>
                  <td>{ev.location}</td>
                  <td className="admin-row-actions">
                    <button className="admin-edit-btn" onClick={() => openEdit(ev)}>Edit</button>
                    <button className="admin-delete-btn" onClick={() => handleDelete(ev)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
