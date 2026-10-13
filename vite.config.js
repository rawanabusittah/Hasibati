import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // base نسبي: يعمل على GitHub Pages سواء كان الريبو user.github.io
  // أو user.github.io/repo-اسم — لا حاجة لتغييره عند أي استضافة.
  base: './',
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 900
  }
})