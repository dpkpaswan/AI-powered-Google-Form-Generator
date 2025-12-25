import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const proxy = {
    '/api': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  };

  // This changes the out put dir from dist to build
  // comment this out if that isn't relevant for your project
  return {
    build: {
      outDir: "build",
      chunkSizeWarningLimit: 2000,
    },
    plugins: [tsconfigPaths(), react()],
    server: {
      port: "4028",
      host: "0.0.0.0",
      strictPort: true,
      allowedHosts: ['localhost', '127.0.0.1', '.amazonaws.com'],
      proxy
    },
    preview: {
      port: Number(process.env.PORT) || 4028,
      strictPort: false,
      host: '0.0.0.0',
      proxy
    }
  };
});