import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.AMAZON_PARTNER_TAG': JSON.stringify(process.env.AMAZON_PARTNER_TAG || 'nutricompare-21'),
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/.sf/**', '**/data/**', '**/docs/**'],
      },
      // Proxy /api/* al servidor serverless local (vercel dev corre en :3001)
      // Para desarrollo local ejecuta: vercel dev (en lugar de npm run dev)
      proxy: process.env.VERCEL_DEV === 'true' ? {} : {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          // Si el servidor API no está corriendo, el hook hace fallback automático al mockup
          onError: () => {},
        },
      },
    },
  };
});
