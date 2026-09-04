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
      // Proxy /api/*: si no se ejecuta vercel dev localmente en el puerto 3001,
      // reenviar automáticamente a la API en producción en Vercel para disponer de datos reales en local
      proxy: {
        '/api': {
          target: process.env.LOCAL_API === 'true' ? 'http://localhost:3001' : 'https://nutricompare-sigma.vercel.app',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
