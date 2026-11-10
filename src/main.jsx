import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Register Service Worker for reliable offline POS counter capability
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => console.log('Sukie POS Offline Service Worker active:', reg.scope))
      // Ask the browser not to evict offline sales and the sync outbox under storage pressure.
      .then(() => navigator.storage?.persist?.())
      .catch((err) => console.warn('Service Worker registration skipped:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
