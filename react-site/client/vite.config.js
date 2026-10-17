import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The React site re-uses the base site's images, style.css and
    // validators.js instead of keeping copies, so Vite must be allowed
    // to read those few things from two folders up.
    fs: {
      allow: ['.', '../../images', '../../style.css', '../../js/validators.js'],
    },
  },
})
