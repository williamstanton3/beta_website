/**
 * Admin Members page — view, add, edit, and delete fraternity brothers.
 *
 * Features:
 *  - Table view of all current brothers
 *  - Inline "Add / Edit" form that slides in when needed
 *  - Photo upload alongside text fields in a single form submission
 *  - Delete with confirmation
 */

import { useEffect, useState } from "react";
import {
  adminGetMembers,
  adminCreateMember,
  adminUpdateMember,
  adminDeleteMember,
} from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

// A brother with no checked positions is just a regular brother — there's no
// "Brother" option here; an empty `roles` array is how that's represented.
const ROLES = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Chaplain",
  "IF Rep",
  "Service Chair",
  "Social Chair",
  "Assistant Social Chair",
  "Merch Chair",
  "Rush Chair",
  "Assistant Rush Chair",
  "Sergeant at Arms",
  "Historian & Alumni Chair",
];

const EMPTY_FORM = {
  first_name: "", last_name: "", class_year: new Date().getFullYear(),
  major: "Business", hometown: "Pittsburgh, PA", roles: [], email: "", bio: "",
};

export default function AdminMembers() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);   // null = creating new
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    try {
      setLoading(true);
      setMembers(await adminGetMembers(token));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSaveError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openEdit(member) {
    setEditingId(member.id);
    setForm({
      first_name: member.first_name, last_name: member.last_name,
      class_year: member.class_year, major: member.major,
      hometown: member.hometown, roles: member.roles || [],
      email: member.email || "", bio: member.bio,
    });
    setPhotoFile(null);
    setPhotoPreview(member.image_url || null);
    setSaveError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role) ? f.roles.filter((r) => r !== role) : [...f.roles, role],
    }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    // Show a local preview immediately before uploading
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      if (editingId) {
        await adminUpdateMember(editingId, form, photoFile, token);
      } else {
        await adminCreateMember(form, photoFile, token);
      }
      setShowForm(false);
      loadMembers();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member) {
    if (!window.confirm(`Remove ${member.first_name} ${member.last_name} from the chapter roster?`)) return;
    try {
      await adminDeleteMember(member.id, token);
      loadMembers();
    } catch (err) { alert(err.message); }
  }

  return (
    <AdminLayout title="Members">
      {/* Action bar */}
      <div className="admin-action-bar">
        <button className="btn btn-primary" onClick={openCreate}>+ Add Brother</button>
        {showForm && (
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
            Cancel
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2 className="admin-form-title">{editingId ? "Edit Brother" : "Add New Brother"}</h2>

          {/* Photo upload */}
          <div className="admin-photo-upload">
            <div className="admin-photo-preview">
              {photoPreview
                ? <img src={photoPreview} alt="Preview" />
                : <span className="admin-photo-placeholder">No Photo</span>}
            </div>
            <div>
              <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
                {photoPreview ? "Change Photo" : "Upload Photo"}
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </label>
              <p className="admin-hint">JPG, PNG, WebP, SVG accepted</p>
            </div>
          </div>

          {/* Two-column text fields */}
          <div className="admin-form-grid">
            <div className="form-group">
              <label>First Name *</label>
              <input required value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="First name" />
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input required value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Last name" />
            </div>
            <div className="form-group">
              <label>Class Year *</label>
              <input required type="number" min="2000" max="2040" value={form.class_year} onChange={e => setForm(f => ({ ...f, class_year: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Major *</label>
              <input required value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} placeholder="e.g. Computer Science" />
            </div>
            <div className="form-group">
              <label>Hometown *</label>
              <input required value={form.hometown} onChange={e => setForm(f => ({ ...f, hometown: e.target.value }))} placeholder="e.g. Atlanta, GA" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="name@gcc.edu" />
            </div>
          </div>

          <div className="form-group">
            <label>Position(s)</label>
            <div className="admin-checkbox-grid">
              {ROLES.map(r => (
                <label key={r} className="admin-checkbox-option">
                  <input type="checkbox" checked={form.roles.includes(r)} onChange={() => toggleRole(r)} />
                  {r}
                </label>
              ))}
            </div>
            <p className="admin-hint">Leave all unchecked for a brother with no position. Check multiple boxes if someone holds more than one role.</p>
          </div>

          <div className="form-group">
            <label>Bio *</label>
            <textarea required rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Short biography..." />
          </div>

          {saveError && <p className="form-error">{saveError}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Save Changes" : "Add Brother"}
          </button>
        </form>
      )}

      {/* Members table */}
      {loading && <p className="admin-loading">Loading members...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>Class Year</th>
                <th>Major</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td>
                    <div className="admin-member-thumb">
                      {m.image_url
                        ? <img src={m.image_url} alt={m.first_name} />
                        : <span>{m.first_name[0]}{m.last_name[0]}</span>}
                    </div>
                  </td>
                  <td><strong>{m.first_name} {m.last_name}</strong></td>
                  <td>
                    {m.roles && m.roles.length > 0
                      ? <span className="admin-role-badge">{m.roles.join(", ")}</span>
                      : <span className="admin-no-role">—</span>}
                  </td>
                  <td>{m.class_year}</td>
                  <td>{m.major}</td>
                  <td>{m.email || <span className="admin-no-role">—</span>}</td>
                  <td className="admin-row-actions">
                    <button className="admin-edit-btn" onClick={() => openEdit(m)}>Edit</button>
                    <button className="admin-delete-btn" onClick={() => handleDelete(m)}>Delete</button>
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
