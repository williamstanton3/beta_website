/**
 * Admin Announcements page — post, edit, and delete news items.
 */

import { useEffect, useState } from "react";
import { adminGetAnnouncements, adminCreateAnnouncement, adminUpdateAnnouncement, adminDeleteAnnouncement } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

const EMPTY_FORM = { title: "", content: "", is_featured: false };

export default function AdminAnnouncements() {
  const { token, logout } = useAuth();
  const [items, setItems] = useState([]);
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
      setItems(await adminGetAnnouncements(token));
    } catch (err) {
      // A silent failure here (no catch) used to leave the table looking
      // empty with no explanation — most commonly caused by an expired
      // admin session (token older than the 8-hour login window).
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null); setForm(EMPTY_FORM); setSaveError(null); setShowForm(true);
  }
  function openEdit(item) {
    setEditingId(item.id);
    setForm({ title: item.title, content: item.content, is_featured: item.is_featured });
    setSaveError(null); setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      if (editingId) await adminUpdateAnnouncement(editingId, form, token);
      else await adminCreateAnnouncement(form, token);
      setShowForm(false); load();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete announcement "${item.title}"?`)) return;
    try { await adminDeleteAnnouncement(item.id, token); load(); }
    catch (err) { alert(err.message); }
  }

  return (
    <AdminLayout title="Announcements">
      <div className="admin-action-bar">
        <button className="btn btn-primary" onClick={openCreate}>+ Post Announcement</button>
        {showForm && <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2 className="admin-form-title">{editingId ? "Edit Announcement" : "Post New Announcement"}</h2>
          <div className="form-group">
            <label>Title *</label>
            <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement headline" />
          </div>
          <div className="form-group">
            <label>Content *</label>
            <textarea required rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Full announcement text..." />
          </div>
          <div className="form-group admin-checkbox-group">
            <label>
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
              {" "} Feature on home page
            </label>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Post"}
          </button>
        </form>
      )}

      {loading && <p className="admin-loading">Loading announcements...</p>}
      {error && (
        <p className="form-error">
          {error}{" "}
          <button type="button" className="admin-edit-btn" onClick={logout}>Log in again</button>
        </p>
      )}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Date</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><br /><span className="admin-hint">{item.content.slice(0, 80)}...</span></td>
                  <td>{item.posted_at}</td>
                  <td>{item.is_featured ? <span className="admin-badge-yes">✓ Featured</span> : "—"}</td>
                  <td className="admin-row-actions">
                    <button className="admin-edit-btn" onClick={() => openEdit(item)}>Edit</button>
                    <button className="admin-delete-btn" onClick={() => handleDelete(item)}>Delete</button>
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
