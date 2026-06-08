import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BlinkUIProvider, Toaster } from '@blinkdotnew/ui'
import App from './App'
import { LanguageProvider } from './i18n/LanguageContext'
import { ThemeProvider } from './i18n/ThemeContext'
import './index.css'

const queryClient = new QueryClient()

function ThemedApp() {
  // Theme is applied directly to document.documentElement by ThemeContext.
  // We pass darkMode="light" to BlinkUIProvider so it never overwrites our class.
  return (
    <BlinkUIProvider theme="linear" darkMode="light">
      <LanguageProvider>
        <Toaster />
        <div className="flex w-full flex-1 flex-col min-h-0">
          <App />
        </div>
      </LanguageProvider>
    </BlinkUIProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
