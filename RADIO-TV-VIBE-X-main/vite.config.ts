import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const shimContent = fs.readFileSync(path.resolve(__dirname, 'src/firebase-shim.js'), 'utf8');

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Inject Firebase compat SDK from CDN before the app bundle
      {
        name: 'inject-firebase-cdn',
        enforce: 'pre',
        transformIndexHtml(html) {
          const scripts = [
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js',
            'https://www.gstatic.com/firebasejs/10.12.2/firebase-storage-compat.js',
          ];
          const injected = scripts.map(s => `<script src="${s}"></script>`).join('\n    ');
          // Inject AFTER modulepreload links but BEFORE the module script
          // This ensures CDN Firebase is available before any app code runs
          return html
            .replace('<script type="module"', `${injected}\n    <script type="module"`);
        },
      },
      // Virtual module: firebase/* imports → firebase-shim content
      {
        name: 'firebase-shim-virtual',
        resolveId(id) {
          if (id === 'firebase/app' || id === 'firebase/auth' ||
              id === 'firebase/firestore' || id === 'firebase/database' ||
              id === 'firebase/storage') {
            return '\0firebase-shim-virtual';
          }
          return null;
        },
        load(id) {
          if (id === '\0firebase-shim-virtual') {
            return shimContent;
          }
          return null;
        },
      },
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Disable minification to prevent iOS Safari TDZ bug with Firebase
      // The minifier incorrectly reorders Firebase's internal ES module variable declarations
      minify: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@supabase') || id.includes('supabase')) return 'supabase';
            if (id.includes('canvas-confetti')) return 'confetti';
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
  };
});