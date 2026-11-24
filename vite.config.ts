import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode single` bundles everything into one HTML file for the private artifact.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  base: './',
  // Build number stamped by CI (GitHub run number); 0 for local builds.
  define: { __APP_BUILD__: JSON.stringify(Number(process.env.VERSION_CODE ?? 0)) },
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  test: { globals: true, environment: 'node' },
}));
