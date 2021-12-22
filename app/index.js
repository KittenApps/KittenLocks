import { StrictMode } from 'react';
import { render } from 'react-dom';
import { RealmAppProvider } from './RealmApp.js';
import App from './App';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations as TracingIntegrations } from '@sentry/tracing';
import AppIcon from '../assets/appicon.png';
import FavIcon from '../assets/favicon.png';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function errorFallback({ error, componentStack, resetError }){
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: 10, overflow: 'scroll', color: '#ffffff', backgroundColor: '#272533' }}>
      <h1>Oops, something went wrong! :(</h1>
      <button onClick={resetError} style={{ width: '100%', border: 0, borderRadius: 4, padding: '4px 10px', color: '#fff', backgroundColor: '#6d7dd1' }}>Try to reset invalid user input state and go back to KittenLocks</button>
      <p><b>Please give the following information to a hard working tech kitten.</b></p>
      <textarea readOnly style={{ width: '100%', height: 300, backgroundColor: '#343241', color: '#ffffff' }} value={`\`\`\`${error.toString()}${componentStack}\`\`\``}/>
      <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777378262474815" title="Discord" width="100%" height="500" allowtransparency="true" frameBorder="0"/>
    </div>
  );
}

// eslint-disable-next-line no-extend-native
if (!Array.prototype.at) Object.defineProperty(Array.prototype, 'at', {
  value(index){ // Pollyfill for Safari
    return this[index >= 0 ? index : this.length + index];
  }
});

if (process.env.CI) Sentry.init({
  dsn: process.env.SENTRY,
  release: `kittenlocks@${process.env.VERSION}+${process.env.COMMIT_REF}`,
  integrations: [new TracingIntegrations.BrowserTracing()],
  tracesSampleRate: 1,
  ignoreErrors: ['AbortError', 'ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications.']
});
const div = document.createElement('div');
div.id = 'container';
document.body.style.backgroundColor = '#272533';
document.body.append(div);

render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={errorFallback} showDialog>
      <BrowserRouter>
        <RealmAppProvider>
          <HelmetProvider>
            <Helmet>
              <meta name="apple-mobile-web-app-capable" content="yes"/>
              <meta name="apple-mobile-web-app-status-bar-style" content="black"/>
              <meta name="theme-color" content="#272533"/>
              <meta name="description" content="a pawtastic WebApp to enchance your Chaster experience"/>
              <meta property="og:title" content="KittenLocks"/>
              <meta property="og:type" content="website"/>
              <meta property="og:url" content="https://www.kittenlocks.de/"/>
              <meta property="og:image" content={`https://www.kittenlocks.de${AppIcon}`}/>
              <meta property="og:description" content="KittenLocks is a pawtastic WebApp to enchance your Chaster experience, built with ❤ by Silizia ~ Stella."/>
              <link rel="icon" href={FavIcon}/>
              <link rel="manifest" href="/manifest.webmanifest"/>
              <link rel="apple-touch-icon" sizes="192x192" href={AppIcon}/>
            </Helmet>
            <App/>
          </HelmetProvider>
        </RealmAppProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>, div
);