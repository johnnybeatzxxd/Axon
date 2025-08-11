// vite.config.js

import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite" // Make sure this import is here

export default defineConfig({
  // The 'tailwindcss()' plugin MUST be in this array
  plugins: [react(), tailwindcss()], 
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
