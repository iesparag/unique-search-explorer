import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const resolve = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: resolve('./src/frontend'),
  build: {
    outDir: resolve('./src/frontend/dist'),
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Forward API calls to the Express backend so fetch('/items') works in dev
      '/items': 'http://localhost:3010'
    }
  }
});
