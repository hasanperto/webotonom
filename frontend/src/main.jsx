import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// jQuery ve Lightbox2 import
import $ from 'jquery'
import 'lightbox2/dist/css/lightbox.min.css'
import 'lightbox2/dist/js/lightbox.min.js'

// jQuery'yi global olarak kullanılabilir yap
window.$ = window.jQuery = $

// Lightbox2'yi başlat
if (typeof window !== 'undefined' && window.$ && window.$.fn && window.$.fn.lightbox) {
  $(document).ready(function () {
    // Lightbox2 otomatik olarak data-lightbox attribute'lu linkleri dinler
    // Ekstra bir init gerekmez, ama ayarları yapılandırabiliriz
    if (window.lightbox) {
      window.lightbox.option({
        'resizeDuration': 200,
        'wrapAround': true,
        'fadeDuration': 300,
        'imageFadeDuration': 300,
        'positionFromTop': 50,
        'showImageNumberLabel': true,
        'alwaysShowNavOnTouchDevices': false,
        'fitImagesInViewport': true,
        'maxWidth': 1200,
        'maxHeight': 800
      });
    }
  });
}

import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
