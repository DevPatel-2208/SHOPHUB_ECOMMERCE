import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { store } from './redux/store.js'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import './index.css'

/**
 * Main Entry — Admin Dashboard
 *
 * StrictMode is intentionally NOT used here to prevent:
 *   - Double useEffect execution (causes duplicate API calls + socket connections)
 *   - Double socket.io connection attempts
 *   - Double NotificationProvider initialization
 * Production behavior is identical without StrictMode.
 * https://react.dev/reference/react/StrictMode#fixing-bugs-found-by-running-effects-twice-in-development
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <ThemeProvider>
        <NotificationProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1E293B',
                color: '#F1F5F9',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#F1F5F9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#F1F5F9',
                },
              },
            }}
          />
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  </Provider>,
)
