import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { cpSync, mkdirSync } from 'fs';

/**
 * Inline plugin that copies non-compiled Chrome extension assets into dist/
 * after every build. No external dependencies needed.
 *
 * After `npm run build`, dist/ is a complete extension — just load it unpacked.
 */
function copyExtensionAssets(): Plugin {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const src  = resolve(__dirname, 'src');
      const dist = resolve(__dirname, 'dist');

      const cp = (from: string, to: string) =>
        cpSync(from, to, { recursive: true, force: true });

      mkdirSync(`${dist}/js`,      { recursive: true });
      mkdirSync(`${dist}/options`, { recursive: true });
      mkdirSync(`${dist}/styles`,  { recursive: true });

      cp(`${src}/manifest.json`,          `${dist}/manifest.json`);
      cp(`${src}/icons`,                  `${dist}/icons`);
      cp(`${src}/js/service-worker.js`,   `${dist}/js/service-worker.js`);
      cp(`${src}/js/options.js`,          `${dist}/js/options.js`);
      cp(`${src}/js/manifest-info.js`,    `${dist}/js/manifest-info.js`);
      cp(`${src}/options/index.html`,     `${dist}/options/index.html`);
      cp(`${src}/styles/options.css`,     `${dist}/styles/options.css`);

      console.log('✓ Extension assets copied to dist/');
    },
  };
}

// All source lives in src/.
// dist/ is the complete, self-contained Chrome extension — load it unpacked.
export default defineConfig({
  plugins: [react(), copyExtensionAssets()],

  // Vite root = src/ so the built HTML lands at dist/index.html
  root: resolve(__dirname, 'src'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        newtab: resolve(__dirname, 'src/index.html'),
      },
    },
    assetsInlineLimit: 4096,
  },

  resolve: {
    alias: {
      // @/ maps to src/ for clean absolute imports throughout the codebase
      '@': resolve(__dirname, 'src'),
    },
  },
});
