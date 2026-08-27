/**
 * Admin Gallery page — manage chapter photos grouped by academic year.
 *
 * Photos live in media/gallery/{year-range}/ (e.g. "25-26") with no
 * database involved. Officers can:
 *  - Pick or create a year folder
 *  - Upload a new photo (always cropped before saving)
 *  - Re-crop a photo already in the gallery (overwrites it in place)
 *  - Delete a photo
 */

import { useEffect, useRef, useState } from "react";
import {
  adminGetGalleryYears,
  adminCreateGalleryYear,
  adminGetGalleryPhotos,
  adminUploadGalleryPhoto,
  adminReplaceGalleryPhoto,
  adminDeleteGalleryPhoto,
} from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminLayout from "./AdminLayout.jsx";
import ImageCropModal from "../../components/ImageCropModal.jsx";

/** Convert "20" / "26" style inputs into a validated "25-26" folder name. */
function toFolderName(startYear, endYear) {
  const start = String(startYear).trim().slice(-2).padStart(2, "0");
  const end = String(endYear).trim().slice(-2).padStart(2, "0");
  return `${start}-${end}`;
}

export default function AdminGallery() {
  const { token } = useAuth();

  const [years, setYears] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loadingYears, setLoadingYears] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [error, setError] = useState(null);

  const [showAddYear, setShowAddYear] = useState(false);
  const [newStartYear, setNewStartYear] = useState("");
  const [newEndYear, setNewEndYear] = useState("");
  const [addYearError, setAddYearError] = useState(null);

  // cropTarget: { mode: "upload", src, file } | { mode: "edit", src, filename }
  const [cropTarget, setCropTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => { loadYears(); }, []);

  useEffect(() => {
    if (selectedFolder) loadPhotos(selectedFolder);
  }, [selectedFolder]);

  async function loadYears() {
    setLoadingYears(true);
    try {
      const yrs = await adminGetGalleryYears(token);
      setYears(yrs);
      if (yrs.length > 0 && !selectedFolder) setSelectedFolder(yrs[0].folder);
    } catch (e) { setError(e.message); }
    finally { setLoadingYears(false); }
  }

  async function loadPhotos(folder) {
    setLoadingPhotos(true);
    try { setPhotos(await adminGetGalleryPhotos(folder, token)); }
    catch (e) { setError(e.message); }
    finally { setLoadingPhotos(false); }
  }

  async function handleAddYear(e) {
    e.preventDefault();
    setAddYearError(null);
    if (!newStartYear || !newEndYear) { setAddYearError("Enter both years."); return; }
    const folder = toFolderName(newStartYear, newEndYear);
    try {
      await adminCreateGalleryYear(folder, token);
      setShowAddYear(false);
      setNewStartYear(""); setNewEndYear("");
      await loadYears();
      setSelectedFolder(folder);
    } catch (err) { setAddYearError(err.message); }
  }

  function handleChooseFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCropTarget({ mode: "upload", src: URL.createObjectURL(file) });
    e.target.value = "";
  }

  function handleEditPhoto(photo) {
    setCropTarget({ mode: "edit", src: photo.file_url, filename: photo.filename });
  }

  async function handleSaveCrop(blob) {
    setSaving(true);
    try {
      if (cropTarget.mode === "upload") {
        await adminUploadGalleryPhoto(selectedFolder, blob, token);
      } else {
        await adminReplaceGalleryPhoto(selectedFolder, cropTarget.filename, blob, token);
      }
      setCropTarget(null);
      await loadPhotos(selectedFolder);
      await loadYears();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(photo) {
    if (!window.confirm("Delete this photo?")) return;
    try {
      await adminDeleteGalleryPhoto(selectedFolder, photo.filename, token);
      await loadPhotos(selectedFolder);
      await loadYears();
    } catch (err) { alert(err.message); }
  }

  return (
    <AdminLayout title="Gallery">
      {/* Year picker */}
      <div className="admin-action-bar">
        <div className="gallery-tabs">
          {years.map((y) => (
            <button
              key={y.folder}
              className={`gallery-tab ${selectedFolder === y.folder ? "active" : ""}`}
              onClick={() => setSelectedFolder(y.folder)}
            >
              {y.label} ({y.count})
            </button>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={() => setShowAddYear((v) => !v)}>
          + Add Year
        </button>
      </div>

      {showAddYear && (
        <form className="admin-form" onSubmit={handleAddYear}>
          <h2 className="admin-form-title">Add a New Year Folder</h2>
          <div className="admin-form-grid">
            <div className="form-group">
              <label>Start Year *</label>
              <input required placeholder="e.g. 2026" value={newStartYear} onChange={(e) => setNewStartYear(e.target.value)} />
            </div>
            <div className="form-group">
              <label>End Year *</label>
              <input required placeholder="e.g. 2027" value={newEndYear} onChange={(e) => setNewEndYear(e.target.value)} />
            </div>
          </div>
          {addYearError && <p className="form-error">{addYearError}</p>}
          <button type="submit" className="btn btn-primary">Create Year</button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}

      {selectedFolder && (
        <>
          <div className="admin-action-bar">
            <label className="btn btn-primary" style={{ cursor: "pointer" }}>
              + Add Photo
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleChooseFile} />
            </label>
          </div>

          <h2 className="admin-section-heading">
            {years.find((y) => y.folder === selectedFolder)?.label} ({photos.length} photos)
          </h2>

          {loadingPhotos ? (
            <p className="admin-loading">Loading photos...</p>
          ) : (
            <div className="admin-media-grid">
              {photos.map((photo) => (
                <div key={photo.filename} className="admin-media-card">
                  {photo.media_type === "video" ? (
                    <video src={photo.file_url} className="admin-media-thumb" controls />
                  ) : (
                    <img src={photo.file_url} alt="" className="admin-media-thumb" />
                  )}
                  <div className="admin-media-info">
                    <div className="admin-row-actions">
                      {photo.media_type === "image" && (
                        <button className="admin-edit-btn" onClick={() => handleEditPhoto(photo)}>Crop</button>
                      )}
                      <button className="admin-delete-btn admin-delete-sm" onClick={() => handleDelete(photo)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loadingYears && years.length === 0 && (
        <p className="admin-loading">No year folders yet — click "+ Add Year" to create one.</p>
      )}

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.src}
          saving={saving}
          onCancel={() => setCropTarget(null)}
          onSave={handleSaveCrop}
        />
      )}
    </AdminLayout>
  );
}
