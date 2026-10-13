import { defineConfig } from 'vite'; // # Build and development configuration.
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { host: '0.0.0.0', port: 5173, strictPort: true } });
