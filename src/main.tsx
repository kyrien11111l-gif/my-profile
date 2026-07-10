import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ResumeProvider } from './state/ResumeContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ResumeProvider>
      <App />
    </ResumeProvider>
  </StrictMode>,
)
