import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true, // זה השורה שחסרה לך
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})