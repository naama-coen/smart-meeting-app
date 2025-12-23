import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // זה החלק הקריטי ל-Docker
    },
    host: true, // מאפשר גישה חיצונית לקונטיינר
    strictPort: true,
    port: 5173, 
  }
})