import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './theme.css';
// # Only production registers offline caching; development always loads current source.
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if(import.meta.env.PROD&&'serviceWorker' in navigator)window.addEventListener('load',()=>{void navigator.serviceWorker.register('/sw.js').catch(()=>{/* # Offline support is optional; game remains usable. */});});
