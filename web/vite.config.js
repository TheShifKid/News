import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // נתיבים יחסיים, כדי שהאתר יעבוד גם מתת-תיקייה כמו ב-GitHub Pages
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 3000 }
});
