import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Hide loading screen once React is ready
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    // Remove the loading screen completely after the fade out animation
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Hide loading screen after React has mounted
setTimeout(hideLoadingScreen, 100);
