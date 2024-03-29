/* eslint-disable unicorn/filename-case */
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RealmAppProvider } from './RealmApp';
import App from './App';
import { createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
import { BrowserTracing, ErrorBoundary as SentryErrorBoundary, init as initSentry, reactRouterV6Instrumentation } from '@sentry/react';
import '@fontsource/roboto/latin-300.css';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-700.css';

function errorFallback({ error, componentStack, resetError }){
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: 10, overflow: 'scroll', color: '#ffffff', backgroundColor: '#272533' }}>
      <h1>Oops, something went wrong! :(</h1>
      <button onClick={resetError} style={{ width: '100%', border: 0, borderRadius: 4, padding: '4px 10px', color: '#fff', backgroundColor: '#6d7dd1' }}>Try to reset invalid user input state and go back to KittenLocks</button>
      <p><b>Please give the following information to a hard working tech kitten.</b></p>
      <textarea readOnly style={{ width: '100%', height: 300, backgroundColor: '#343241', color: '#ffffff' }} value={`\`\`\`${error.toString()}${componentStack}\`\`\``}/>
      <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777378262474815" title="Discord" width="100%" height="500" frameBorder="0"/>
    </div>
  );
}

// eslint-disable-next-line no-extend-native
if (!Array.prototype.at) Object.defineProperty(Array.prototype, 'at', {
  value(index){ // Pollyfill for Safari
    return this[index >= 0 ? index : this.length + index];
  }
});

if (process.env.CI) initSentry({
  dsn: process.env.SENTRY,
  release: `kittenlocks@${process.env.VERSION}+${process.env.COMMIT_REF}`,
  integrations: [
    new BrowserTracing({
     routingInstrumentation: reactRouterV6Instrumentation(useEffect, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes)
    })
  ],
  tracesSampleRate: 1,
  ignoreErrors: ['AbortError', 'ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications.']
});

const div = document.createElement('div');
div.id = 'container';
document.body.style.backgroundColor = '#272533';
document.body.append(div);

createRoot(div).render(
  <StrictMode>
    <SentryErrorBoundary fallback={errorFallback} showDialog>
      <RealmAppProvider>
        <App/>
      </RealmAppProvider>
    </SentryErrorBoundary>
  </StrictMode>
);