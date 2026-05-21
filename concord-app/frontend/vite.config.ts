import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Base path: GitHub Pages serves at /Hospitality-Travel-ODI-Demo/.
// Override with VITE_BASE=/ for root previews.
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? '/Hospitality-Travel-ODI-Demo/',
})
