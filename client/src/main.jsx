import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ToastContext'
import { I18nProvider } from './i18n/I18nContext'
import { AccessibilityProvider } from './context/AccessibilityContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
          <AccessibilityProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AccessibilityProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
