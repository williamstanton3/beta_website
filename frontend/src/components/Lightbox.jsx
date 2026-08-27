/**
 * Lightbox — fullscreen overlay for images and videos.
 *
 * Props:
 *   items    : array of { file_url, media_type }
 *   index    : currently open item index (null = closed)
 *   onClose  : () => void
 *   onPrev   : () => void
 *   onNext   : () => void
 */
import { useEffect, useCallback } from "react";

export default function Lightbox({ items, index, onClose, onPrev, onNext }) {
  if (index === null || index === undefined || !items[index]) return null;

  const current = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  // Keyboard navigation
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape")    onClose();
      if (e.key === "ArrowLeft"  && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      {/* Prev arrow */}
      {hasPrev && (
        <button
          className="lightbox-arrow lightbox-prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      {/* Media */}
      <div className="lightbox-media-wrap" onClick={(e) => e.stopPropagation()}>
        {current.media_type === "video" ? (
          <video
            key={current.file_url}
            src={current.file_url}
            className="lightbox-media"
            controls
            autoPlay
          />
        ) : (
          <img
            key={current.file_url}
            src={current.file_url}
            alt=""
            className="lightbox-media"
          />
        )}
      </div>

      {/* Next arrow */}
      {hasNext && (
        <button
          className="lightbox-arrow lightbox-next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          ›
        </button>
      )}

      {/* Close button */}
      <button
        className="lightbox-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {/* Counter */}
      <div className="lightbox-counter">
        {index + 1} / {items.length}
      </div>
    </div>
  );
}
