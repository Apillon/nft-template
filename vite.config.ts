import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  build: {
    rollupOptions: {
      external: ['vite-plugin-node-polyfills/shims/global'],
    },
  },
  plugins: [nodePolyfills(), mkcert()],
});
