import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // The backend's CORS only allows FRONTEND_URL (port 5173); fail loudly instead of moving to another port.
  server: { port: 5173, strictPort: true },
})
