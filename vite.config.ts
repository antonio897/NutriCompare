import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

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
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/.sf/**', '**/data/**', '**/docs/**'],
      },
      // Proxy /api/* al servidor serverless local (vercel dev corre en :3001)
      // Si el servidor API no está corriendo, manejamos el error limpiamente sin lanzar ECONNREFUSED ruidoso en consola
      proxy: process.env.VERCEL_DEV === 'true' ? {} : {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (_err, _req, res) => {
              if (res && !('headersSent' in res && res.headersSent)) {
                try {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Backend server not running', fallback: true }));
                } catch {
                  // socket closed
                }
              }
            });
          },
        },
      },
    },
  };
});
