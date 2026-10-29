import { defineConfig } from 'vitest/config';

// Relative base so the same build works on GitHub Pages, inside the
// Android app (Capacitor) and inside the Windows app (Electron).
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 3200,
  },
  server: {
    proxy: {
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
