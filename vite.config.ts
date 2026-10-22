import { defineConfig } from 'vite';
import {
  rundotGameLibrariesPlugin,
  rundotGamePlaygroundPlugin,
} from '@series-inc/rundot-game-sdk/vite';

export default defineConfig({
  plugins: [
    rundotGameLibrariesPlugin(),
    rundotGamePlaygroundPlugin(),
  ],
  base: './',
  server: {
    // RUN.world's Playground documentation requires allowedHosts support.
    // Do not expose an authenticated development server to the public internet.
    host: '127.0.0.1',
    allowedHosts: true,
  },
  esbuild: { target: 'es2022' },
  optimizeDeps: { esbuildOptions: { target: 'es2022' } },
  build: { target: 'es2022', outDir: 'dist' },
});
