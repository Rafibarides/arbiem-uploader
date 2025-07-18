import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base path for GitHub Pages deployment
  // Change 'arbiem-uploader' to match your GitHub repository name
  base: process.env.NODE_ENV === 'production' ? '/arbiem-uploader/' : '/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
