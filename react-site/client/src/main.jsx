import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Bootstrap first, then the base site's stylesheet, so our own rules win
// (same order as fees-calculator.html).
import 'bootstrap/dist/css/bootstrap.min.css'
import '../../../style.css'

import App from './App.jsx'
import { AuthProvider } from './auth'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
