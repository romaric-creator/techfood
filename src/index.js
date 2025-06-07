import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { FeedbackProvider } from './contexts/FeedbackContext';
import FeedbackSnackbar from './components/FeedbackSnackbar';
import { AuthProvider } from './contexts/UserContext';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <FeedbackProvider>
      <AuthProvider>
        <App />
        <FeedbackSnackbar />
      </AuthProvider>
    </FeedbackProvider>
  </React.StrictMode>
);
