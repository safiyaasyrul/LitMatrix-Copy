import path from 'path';
import {defineConfig} from 'vite';

const port = Number(process.env.PORT ?? 3000);
const configRoot = path.resolve(import.meta.dirname);
const reactPlugin = (await import(path.join(configRoot, 'node_modules/@vitejs/plugin-react/dist/index.js'))).default;
const tailwindPlugin = (await import(path.join(configRoot, 'node_modules/@tailwindcss/vite/dist/index.mjs'))).default;

export default defineConfig(() => {
  return {
    plugins: [reactPlugin(), tailwindPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port,
      host: '0.0.0.0',
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
