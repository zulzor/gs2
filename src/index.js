import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js'; // We will create this component next
import { AuthProvider } from './context/AuthContext.js';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
