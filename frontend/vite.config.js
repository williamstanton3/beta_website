import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for the Beta Sigma React frontend.
// The dev server proxies both /api AND /media requests to the FastAPI
// backend on port 8000, so the browser can load uploaded images directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Use 127.0.0.1 (IPv4) instead of localhost — on macOS, localhost resolves
      // to ::1 (IPv6) but uvicorn listens on IPv4, causing ECONNREFUSED errors.
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
