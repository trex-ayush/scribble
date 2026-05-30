import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { FeedbackProvider } from './components/feedback/FeedbackProvider.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <FeedbackProvider>
        <App />
      </FeedbackProvider>
    </BrowserRouter>
  </React.StrictMode>
);
