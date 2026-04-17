import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  // Dev-only proxy: when running `npm run dev`, /api/* calls go to the
  // Express server on port 8080. In production, Express serves everything.
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
});
