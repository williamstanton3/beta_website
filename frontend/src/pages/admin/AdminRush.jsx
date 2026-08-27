/**
 * Admin Rush page — create, edit, and delete the content sections shown
 * on the public Rush page (e.g. "Why Beta Sigma?", "Important Dates").
 */

import { useEffect, useState } from "react";
import { adminGetRushInfo, adminCreateRushInfo, adminUpdateRushInfo, adminDeleteRushInfo } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

const EMPTY_FORM = { section_title: "", section_content: "", display_order: 0 };

export default function AdminRush() {
  const { token, logout } = useAuth();
  const [sections, setSections] = useState([]);
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
      setSections(await adminGetRushInfo(token));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, display_order: sections.length + 1 });
    setSaveError(null); setShowForm(true);
  }
  function openEdit(section) {
    setEditingId(section.id);
    setForm({
      section_title: section.section_title,
      section_content: section.section_content,
      display_order: section.display_order,
    });
    setSaveError(null); setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true); setSaveError(null);
    try {
      const payload = { ...form, display_order: +form.display_order };
      if (editingId) await adminUpdateRushInfo(editingId, payload, token);
      else await adminCreateRushInfo(payload, token);
      setShowForm(false); load();
    } catch (err) { setSaveError(err.message); }
    finally { setSaving(false); }
  }

  async function handleDelete(section) {
    if (!window.confirm(`Delete section "${section.section_title}"?`)) return;
    try { await adminDeleteRushInfo(section.id, token); load(); }
    catch (err) { alert(err.message); }
  }

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <AdminLayout title="Rush Page">
      <div className="admin-action-bar">
        <button className="btn btn-primary" onClick={openCreate}>+ Add Section</button>
        {showForm && <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>}
      </div>

      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2 className="admin-form-title">{editingId ? "Edit Section" : "Add New Section"}</h2>
          <div className="admin-form-grid">
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Section Title *</label>
              <input required value={form.section_title} onChange={f("section_title")} placeholder="Why Beta Sigma?" />
            </div>
            <div className="form-group" style={{ gridColumn: "1/-1" }}>
              <label>Section Content *</label>
              <textarea required rows={5} value={form.section_content} onChange={f("section_content")} placeholder="Section text shown on the Rush page..." />
            </div>
            <div className="form-group">
              <label>Display Order</label>
              <input type="number" value={form.display_order} onChange={f("display_order")} />
              <p className="admin-hint">Lower numbers appear first on the Rush page.</p>
            </div>
          </div>
          {saveError && <p className="form-error">{saveError}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Section"}
          </button>
        </form>
      )}

      {loading && <p className="admin-loading">Loading rush sections...</p>}
      {error && (
        <p className="form-error">
          {error}{" "}
          <button type="button" className="admin-edit-btn" onClick={logout}>Log in again</button>
        </p>
      )}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Title</th><th>Content</th><th>Actions</th></tr></thead>
            <tbody>
              {sections
                .slice()
                .sort((a, b) => a.display_order - b.display_order)
                .map(section => (
                  <tr key={section.id}>
                    <td>{section.display_order}</td>
                    <td><strong>{section.section_title}</strong></td>
                    <td>{section.section_content.slice(0, 80)}{section.section_content.length > 80 ? "…" : ""}</td>
                    <td className="admin-row-actions">
                      <button className="admin-edit-btn" onClick={() => openEdit(section)}>Edit</button>
                      <button className="admin-delete-btn" onClick={() => handleDelete(section)}>Delete</button>
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
