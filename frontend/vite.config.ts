import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ensure assets are resolved correctly when deployed to Render Static Site
  base: '/',
  server: {
    // Serve index.html for all 404s so BrowserRouter handles the route
    historyApiFallback: true,
  },
  preview: {
    // Same fallback for `vite preview` (production preview)
    historyApiFallback: true,
  },
})
