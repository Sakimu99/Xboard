import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { getLanguage } from './i18n'
import { installEffects } from './lib/effects'
import './index.css'

installEffects()
document.documentElement.lang = getLanguage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
