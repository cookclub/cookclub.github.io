import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SessionProvider } from 'next-auth/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <SessionProvider>
       <BrowserRouter>
         <App />
       </BrowserRouter>
     </SessionProvider>
  </StrictMode>,
)