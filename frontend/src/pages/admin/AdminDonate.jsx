/**
 * Admin Donate page — edit the donation page content.
 * Officers can change the headline, mission text, impact bullet points,
 * payment link, and fundraising goal without redeploying.
 */

import { useEffect, useState } from "react";
import { adminGetDonateInfo, adminUpdateDonateInfo } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

export default function AdminDonate() {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  // Bullets edited as a multi-line textarea (one bullet per line)
  const [bulletsText, setBulletsText] = useState("");

  useEffect(() => {
    adminGetDonateInfo(token)
      .then(data => {
        setForm(data);
        setBulletsText(data.impact_bullets.join("\n"));
      })
      .catch(err => setError(err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setSaved(false); setError(null);
    try {
      const bullets = bulletsText.split("\n").map(b => b.trim()).filter(Boolean);
      await adminUpdateDonateInfo({ ...form, impact_bullets: bullets }, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  if (!form) return <AdminLayout title="Donate Page"><p className="admin-loading">Loading...</p></AdminLayout>;

  const f = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <AdminLayout title="Donate Page">
      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label>Page Headline *</label>
            <input required value={form.headline} onChange={f("headline")} placeholder="Support Beta Sigma" />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label>Mission Text *</label>
            <textarea required rows={5} value={form.mission_text} onChange={f("mission_text")} placeholder="Why your donation matters..." />
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label>Impact Bullets (one per line)</label>
            <textarea
              rows={5}
              value={bulletsText}
              onChange={e => setBulletsText(e.target.value)}
              placeholder={"Annual academic scholarships\nChapter house improvements\nPhilanthropy events"}
            />
            <p className="admin-hint">Each line becomes a bullet point on the Donate page.</p>
          </div>
          <div className="form-group" style={{ gridColumn: "1/-1" }}>
            <label>Payment Link *</label>
            <input required type="url" value={form.payment_link} onChange={f("payment_link")} placeholder="https://your-payment-link.com" />
            <p className="admin-hint">Paste your university giving page, Stripe, or PayPal link here.</p>
          </div>
          <div className="form-group">
            <label>Button Text</label>
            <input value={form.payment_button_text} onChange={f("payment_button_text")} placeholder="Donate Now" />
          </div>
          <div className="form-group">
            <label>Fundraising Goal ($)</label>
            <input type="number" value={form.goal_amount || ""} onChange={e => setForm(prev => ({ ...prev, goal_amount: +e.target.value }))} placeholder="10000" />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {saved && <p className="form-success">Donation page updated successfully!</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </AdminLayout>
  );
}
