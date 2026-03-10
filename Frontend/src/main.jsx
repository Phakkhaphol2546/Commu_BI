import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // มั่นใจว่าคุณมีไฟล์ css นี้อยู่ ถ้าไม่มีให้ลบบรรทัดนี้ออก

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)