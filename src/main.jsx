import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<pre style="color:red;padding:16px;white-space:pre-wrap;font-size:12px;background:#111;min-height:100vh;">${e.message}\n\n${e.error?.stack || ''}</pre>`;
});

window.addEventListener('unhandledrejection', (e) => {
  document.body.innerHTML = `<pre style="color:red;padding:16px;white-space:pre-wrap;font-size:12px;background:#111;min-height:100vh;">${e.reason?.message || e.reason}\n\n${e.reason?.stack || ''}</pre>`;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
