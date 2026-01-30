import React from 'react';
import ReactDOM from 'react-dom/client';
// Using PascalCase to match standard React naming conventions and avoid casing conflicts
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Não foi possível encontrar o elemento root");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);