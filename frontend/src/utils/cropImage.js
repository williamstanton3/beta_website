/**
 * Canvas-based helper for turning a react-easy-crop selection into an
 * uploadable image Blob. Used by ImageCropModal.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Could not load the image for cropping.")));
    image.src = src;
  });
}

/**
 * For http(s) URLs (photos already on the server), the same URL is often
 * already displayed elsewhere on the page via a plain <img> with no
 * `crossOrigin` set. Browsers can reuse that cached, CORS-unvalidated
 * response for a later `crossOrigin="anonymous"` load of the same URL and
 * fail it outright, even though the file loads fine everywhere else.
 * Fetching the bytes ourselves and handing the canvas a local blob: URL
 * sidesteps that cache ambiguity completely — no crossOrigin needed.
 */
async function toLocalObjectUrl(src) {
  if (!/^https?:\/\//i.test(src)) return { url: src, revoke: false };
  const response = await fetch(src, { mode: "cors", credentials: "omit", cache: "no-store" });
  if (!response.ok) throw new Error("Could not load the image for cropping.");
  const blob = await response.blob();
  return { url: URL.createObjectURL(blob), revoke: true };
}

/** Draw the cropped region onto a canvas and resolve a JPEG Blob. */
export async function getCroppedImageBlob(imageSrc, croppedAreaPixels) {
  const { url, revoke } = await toLocalObjectUrl(imageSrc);
  let image;
  try {
    image = await loadImage(url);
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(croppedAreaPixels.width);
  canvas.height = Math.round(croppedAreaPixels.height);

  const ctx = canvas.getContext("2d");
  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not crop image"))),
      "image/jpeg",
      0.92
    );
  });
}
