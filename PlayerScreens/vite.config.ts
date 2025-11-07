import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: ['tom-laptop.tail6d16d1.ts.net', 'james-mbp-16.atlas-scoville.ts.net'],
  },
  base: '/',

})
