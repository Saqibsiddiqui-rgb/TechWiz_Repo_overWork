import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StoreProvider } from './lib/store';
import { Toaster } from './components/ui/Feedback';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
      <Toaster />
    </StoreProvider>
  </StrictMode>,
);
