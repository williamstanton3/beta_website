/**
 * Admin Pledge Classes page.
 *
 * Officers upload photos for each pledge class year.
 * Tabs along the top filter by year. A "+ New Year" button adds a new year.
 */

import { useEffect, useRef, useState } from "react";
import {
  adminGetPledgeMedia,
  adminGetPledgeYears,
  adminUploadPledgeMedia,
  adminDeletePledgeMedia,
} from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";

export default function AdminPledgeClasses() {
  const { token } = useAuth();
  const [allMedia, setAllMedia] = useState([]);
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload form state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef();

  // New year dialog
  const [showNewYear, setShowNewYear] = useState(false);
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const [media, yrs] = await Promise.all([
        adminGetPledgeMedia(token),
        adminGetPledgeYears(token),
      ]);
      setAllMedia(media);
      setYears(yrs);
      // Default to the most recent year
      if (yrs.length > 0 && !activeYear) setActiveYear(yrs[0]);
    } finally { setLoading(false); }
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview({ url: URL.createObjectURL(f), isVideo: f.type.startsWith("video/") });
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) { setUploadError("Please select a file."); return; }
    if (!activeYear) { setUploadError("Select or create a year tab first."); return; }
    setUploading(true); setUploadError(null);
    try {
      await adminUploadPledgeMedia(
        { year: activeYear, title: title || `Class of ${activeYear}`, display_order: 0 },
        file,
        token,
      );
      setFile(null); setPreview(null); setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      load();
    } catch (err) { setUploadError(err.message); }
    finally { setUploading(false); }
  }

  function addNewYear() {
    const yr = parseInt(newYear, 10);
    if (!years.includes(yr)) {
      const updated = [...years, yr].sort((a, b) => b - a);
      setYears(updated);
    }
    setActiveYear(yr);
    setShowNewYear(false);
  }

  async function handleDelete(item) {
    if (!window.confirm(`Delete this photo from the Class of ${item.year}?`)) return;
    try { await adminDeletePledgeMedia(item.id, token); load(); }
    catch (err) { alert(err.message); }
  }

  const filteredMedia = allMedia.filter(m => m.year === activeYear);

  return (
    <AdminLayout title="Pledge Classes">

      {/* Year tabs */}
      <div className="admin-year-tabs">
        {years.map(yr => (
          <button
            key={yr}
            className={`admin-year-tab ${activeYear === yr ? "active" : ""}`}
            onClick={() => setActiveYear(yr)}
          >
            Class of {yr}
          </button>
        ))}
        <button className="admin-year-tab admin-year-add" onClick={() => setShowNewYear(true)}>
          + New Year
        </button>
      </div>

      {/* New year dialog */}
      {showNewYear && (
        <div className="admin-form" style={{ marginBottom: "var(--space-xl)" }}>
          <h3>Add Pledge Class Year</h3>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} min="2000" max="2040" />
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button className="btn btn-primary" onClick={addNewYear}>Add Year</button>
            <button className="btn btn-secondary" onClick={() => setShowNewYear(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Upload form for active year */}
      {activeYear && (
        <form className="admin-form" onSubmit={handleUpload}>
          <h2 className="admin-form-title">Upload Photo for Class of {activeYear}</h2>

          <div className="admin-upload-zone" onClick={() => fileInputRef.current?.click()}>
            {preview ? (
              preview.isVideo
                ? <video src={preview.url} className="admin-upload-preview" controls />
                : <img src={preview.url} className="admin-upload-preview" alt="Preview" />
            ) : (
              <div className="admin-upload-placeholder">
                <span>📸</span>
                <p>Click to choose a photo or video</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleFileChange} />
          </div>

          <div className="form-group" style={{ marginTop: "var(--space-md)" }}>
            <label>Photo Title (optional)</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={`Class of ${activeYear} — Photo`} />
          </div>

          {uploadError && <p className="form-error">{uploadError}</p>}
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? "Uploading..." : `Upload to Class of ${activeYear}`}
          </button>
        </form>
      )}

      {/* Media grid for active year */}
      {loading && <p className="admin-loading">Loading...</p>}
      {!loading && activeYear && (
        <>
          <h2 className="admin-section-heading">
            Class of {activeYear} — {filteredMedia.length} photo{filteredMedia.length !== 1 ? "s" : ""}
          </h2>
          <div className="admin-media-grid">
            {filteredMedia.map(item => (
              <div key={item.id} className="admin-media-card">
                {item.media_type === "video" ? (
                  <video src={item.file_url} className="admin-media-thumb" controls />
                ) : (
                  <img src={item.file_url} alt={item.title} className="admin-media-thumb" />
                )}
                <div className="admin-media-info">
                  <p className="admin-media-title">{item.title}</p>
                  <button className="admin-delete-btn admin-delete-sm" onClick={() => handleDelete(item)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
