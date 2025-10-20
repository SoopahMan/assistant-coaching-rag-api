import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import tailwindcss from '@tailwindcss/vite'
import tailwindTypography from '@tailwindcss/typography'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), tailwindTypography],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
