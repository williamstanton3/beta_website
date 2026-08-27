/**
 * Public Gallery page — chapter photos grouped by academic year.
 * Click any photo to enlarge; click any video thumbnail to play fullscreen.
 */

import { useEffect, useState } from "react";
import { fetchGalleryByYear } from "../api/client.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Lightbox from "../components/Lightbox.jsx";

/** Fisher-Yates shuffle — returns a new array in random order. */
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function Gallery() {
  const [yearGroups, setYearGroups]         = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  // Lightbox state: { items: [...], index: number } | null
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    setGalleryLoading(true);
    fetchGalleryByYear()
      .then(groups => setYearGroups(
        groups.map(group => ({ ...group, photos: shuffle(group.photos) }))
      ))
      .finally(() => setGalleryLoading(false));
  }, []);

  function openLightbox(allPhotos, clickedIndex) {
    setLightbox({ items: allPhotos, index: clickedIndex });
  }

  return (
    <div className="page gallery-page">
      <section className="page-header">
        <div className="container page-header-with-crest">
          <div className="page-header-text">
            <h1>Photo Gallery</h1>
          </div>
          <img src="/media/photos/Mark 2 Mod 1.jpg" alt="Beta Sigma crest" className="page-header-crest" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          {galleryLoading ? (
            <LoadingSpinner message="Loading photos..." />
          ) : (
            yearGroups.map(group => (
              <div key={group.label} className="gallery-year-section">
                <h3 className="gallery-year-heading">{group.label}</h3>
                <div className="gallery-grid">
                  {group.photos.map((photo, idx) => (
                    <div
                      key={photo.file_url}
                      className="gallery-card gallery-card-clickable"
                      onClick={() => openLightbox(group.photos, idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && openLightbox(group.photos, idx)}
                      aria-label={photo.media_type === "video" ? "Play video" : "View photo"}
                    >
                      {photo.media_type === "video" ? (
                        <>
                          <video
                            src={photo.file_url}
                            className="gallery-media"
                            preload="metadata"
                            muted
                          />
                          <div className="gallery-play-icon">▶</div>
                        </>
                      ) : (
                        <img src={photo.file_url} alt="" className="gallery-media" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Lightbox overlay */}
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(lb => ({ ...lb, index: lb.index - 1 }))}
          onNext={() => setLightbox(lb => ({ ...lb, index: lb.index + 1 }))}
        />
      )}
    </div>
  );
}
