import { defineConfig } from 'vite'; // # Build and development configuration.
import react from '@vitejs/plugin-react';
import { version } from './package.json';
// # Pages uses its repository subpath; the existing local preview keeps its root build.
export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/one-pot-game/' : '/',
  build: { outDir: mode === 'pages' ? 'dist-pages' : 'dist' },
  plugins: [react(), { name: 'release-version', transformIndexHtml: html => html.replace('%APP_VERSION%', version) }],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
}));
