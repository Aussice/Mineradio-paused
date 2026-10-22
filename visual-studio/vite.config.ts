import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: __dirname,
  base: './',
  plugins: [react()],
  build: {
    outDir: '../public/visual-studio',
    emptyOutDir: true,
    rollupOptions: { input: { editor: resolve(__dirname, 'index.html'), stage: resolve(__dirname, 'stage.html') } },
  },
});
