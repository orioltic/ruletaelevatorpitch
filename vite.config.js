import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Esto es vital para que los archivos carguen bien en GitHub Pages
  base: './', 
})
