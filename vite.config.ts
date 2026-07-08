import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

// Single source of truth for the app version is package.json.
// Inject it at build time so the deployed UI shows the version it was built from.
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
);

export default defineConfig({
  base: '/autospectra-overlay/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // 纯静态产物，无外部 CDN 依赖
    assetsInlineLimit: 0,
  },
});