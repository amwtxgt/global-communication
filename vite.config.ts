import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        main: resolve(__dirname, 'src/main.ts'),
        preload: resolve(__dirname, 'src/preload.ts'),
        renderer: resolve(__dirname, 'src/renderer.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['electron'],
    },
  },
  plugins: [dts()],
}); 