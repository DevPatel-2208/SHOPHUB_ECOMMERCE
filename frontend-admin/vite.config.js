import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let backendPort = 5000
try {
  const activePortPath = path.resolve(__dirname, '../backend/.active-port')
  if (fs.existsSync(activePortPath)) {
    const data = JSON.parse(fs.readFileSync(activePortPath, 'utf-8'))
    backendPort = data.port
    console.log(`[vite] Backend active port detected: ${backendPort}`)
  }
} catch (err) {
  console.warn(`[vite] Could not read active port, using default: ${backendPort}`)
}

const backendTarget = `http://localhost:${backendPort}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendTarget,
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
      },
    },
  },
})
