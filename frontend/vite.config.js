import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // HMR WebSocket must use port 80 (the nginx entry point seen by the browser)
    // otherwise Vite falls back to full-page reloads causing an infinite refresh loop.
    hmr: {
      clientPort: 80,
    },
    // Proxy is only active when Vite is accessed directly (port 5173).
    // In Docker, nginx routes /api → PHP-FPM itself.
    proxy: {
      '/api': {
        target: 'http://nginx:80',
        changeOrigin: true,
      },
    },
  },
});
