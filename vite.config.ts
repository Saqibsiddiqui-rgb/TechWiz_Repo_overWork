import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * In development, /api/* is forwarded to the PHP API (the separate campus-coin-api folder in
 * XAMPP's htdocs), so the browser sees one origin and there are no CORS issues.
 * If the API folder has a different name or Apache uses another port, set API_TARGET in .env, e.g.
 *   API_TARGET=http://127.0.0.1:8080/my-api/index.php
 * 127.0.0.1 is used instead of localhost because Node may resolve localhost to IPv6 (::1),
 * which XAMPP's Apache often doesn't listen on.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.API_TARGET || 'http://127.0.0.1/campus-coin-api/index.php';
  const url = new URL(target);
  return {
    base: './', // built files work from any sub-folder, e.g. htdocs/campus-coin/dist
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: url.origin,
          changeOrigin: true,
          rewrite: (path) => url.pathname + path.replace(/^\/api/, ''),
        },
      },
    },
  };
});
