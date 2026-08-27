/**
 * Reusable crop dialog built on react-easy-crop.
 *
 * Works for both brand-new uploads (imageSrc = local object URL) and
 * re-cropping an existing photo already on the server (imageSrc = its URL).
 * Calling code decides what to do with the resulting Blob (upload vs. replace).
 */

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImageBlob } from "../utils/cropImage.js";

/**
 * `aspect` is fixed rather than user-selectable so a crop always comes out
 * matching the ratio the photo will actually be displayed at (see
 * `.gallery-media` in index.css, which uses the same 4:3 ratio). If this
 * modal is ever reused somewhere with a different display ratio, pass a
 * different `aspect` prop rather than letting the ratio drift out of sync.
 */
export default function ImageCropModal({ imageSrc, onCancel, onSave, saving, aspect = 4 / 3 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [error, setError] = useState(null);

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) {
      setError("Move or zoom the image slightly before saving so the crop area is set.");
      return;
    }
    try {
      setError(null);
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onSave(blob);
    } catch (err) {
      setError(err?.message || "Something went wrong while cropping this image.");
    }
  }

  return (
    <div className="crop-modal-overlay" onClick={onCancel}>
      <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="admin-form-title">Crop Photo</h2>

        <div className="crop-modal-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape="rect"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
          />
        </div>

        <div className="crop-modal-controls">
          <p className="crop-modal-hint">
            Cropped to 4:3 to match how it's displayed in the gallery.
          </p>

          <label className="crop-zoom-control">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="crop-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
