import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // מאפשר גישה מחוץ ל-Container
    port: 5173,      // הפורט שבו האתר רץ
    strictPort: true, 
    watch: {
      usePolling: true, // קריטי כדי ששינויי קוד ועיצוב יתעדכנו בזמן אמת בדוקר
    },
  },
})