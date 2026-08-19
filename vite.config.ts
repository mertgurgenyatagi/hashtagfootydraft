/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works from a GitHub Pages project subpath
  // without hardcoding the repo name.
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'terminal-game-narrator',
      configureServer(server) {
        server.middlewares.use('/api/log', (req, res) => {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                const timestamp = new Date().toLocaleTimeString()
                console.log(`\x1b[90m[${timestamp}]\x1b[0m ${data.message || data.text}`)
              } catch {
                console.log(body)
              }
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/plain')
              res.end('OK')
            })
          } else {
            res.statusCode = 404
            res.end()
          }
        })
      }
    }
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
