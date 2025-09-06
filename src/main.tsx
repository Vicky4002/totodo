import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Register service worker for offline capability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('Service Worker registered for offline support'))
      .catch(() => console.log('Service Worker registration failed'));
  });
}

// Enable app to work offline by caching resources
if ('caches' in window) {
  caches.open('totodo-offline-v1').then(cache => {
    cache.addAll([
      '/',
      '/manifest.json',
      '/lovable-uploads/80f966c5-4aaf-420d-898b-4d30d3e0903b.png'
    ]).catch(() => {
      // Silently fail if caching fails
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
