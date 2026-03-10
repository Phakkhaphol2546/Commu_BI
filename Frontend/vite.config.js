import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ✅ base: './' สำคัญมากสำหรับ Server เพื่อให้ไฟล์ index.html หา CSS/JS เจอ (แก้จอขาว)
  base: './', 
  
  server: {
    // ✅ proxy ตรงนี้ เอาไว้ใช้ "ตอนคุณรัน localhost:5173 บนเครื่องตัวเอง" เท่านั้น
    // เพื่อให้มันคุยกับ backend (localhost:3001) ได้โดยไม่ติด CORS
    // ❌ ห้ามใส่ URL ของ Server จริงลงไปตรงนี้เด็ดขาด
    proxy: {
      '/api': {
        target: 'https://communitybi.sru.ac.th',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'https://communitybi.sru.ac.th',
        changeOrigin: true,
      }
    }
  }
})