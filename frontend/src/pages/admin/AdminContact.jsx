/**
 * Admin Contact page — edit the president's name/email shown on the
 * public Contact page. Meant to be updated each year as officers change.
 */

import { useEffect, useState } from "react";
import { adminGetContactInfo, adminUpdateContactInfo } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

export default function AdminContact() {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminGetContactInfo(token)
      .then(setForm)
      .catch(err => setError(err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setSaved(false); setError(null);
    try {
      await adminUpdateContactInfo(form, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (!form) return <AdminLayout title="Contact Page"><p className="admin-loading">Loading...</p></AdminLayout>;

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <AdminLayout title="Contact Page">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div className="form-group">
            <label>President's Name</label>
            <input value={form.president_name} onChange={f("president_name")} placeholder="Full name" />
          </div>
          <div className="form-group">
            <label>President's Email</label>
            <input type="email" value={form.president_email} onChange={f("president_email")} placeholder="president@school.edu" />
          </div>
        </div>
        <p className="admin-hint">Shown in the "President" card on the public Contact page. Update this whenever the president changes.</p>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">Contact page updated successfully!</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AdminLayout>
  );
}
