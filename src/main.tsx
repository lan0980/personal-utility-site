import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { theme } from './theme';
import { migrateLocalStorage } from './utils/migration';
import { syncEngine } from './services/sync';
import { authManager } from './services/auth';
import './index.css';

// Run idempotent localStorage migration before rendering
migrateLocalStorage();

// Initialize sync engine if user is already logged in
if (authManager.isLoggedIn()) {
  syncEngine.start();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
