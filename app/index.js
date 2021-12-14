import { StrictMode } from 'react';
import { render } from 'react-dom';
import { RealmAppProvider } from './RealmApp.js';
import App from './App';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { Integrations as TracingIntegrations } from '@sentry/tracing';

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

if (process.env.CI) Sentry.init({
  dsn: 'https://97ce662232dc48e8967956f7bcae23f5@o1079625.ingest.sentry.io/6084627',
  release: `kittenlocks@${process.env.npm_package_version}+${process.env.COMMIT_REF}`,
  integrations: [new TracingIntegrations.BrowserTracing()],
  tracesSampleRate: 1,
  ignoreErrors: ['AbortError', 'ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications.']
});
const div = document.createElement('div');
div.id = 'container';
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
              <meta name="theme-color" content="#1f1d2b"/>
              <meta name="description" content="a pawtastic WebApp to enchance your Chaster experience"/>
              <meta property="og:title" content="KittenLocks"/>
              <meta property="og:type" content="website"/>
              <meta property="og:url" content="https://www.kittenlocks.de/"/>
              <meta property="og:image" content="https://www.kittenlocks.de/appicon.png"/>
              <meta property="og:description" content="KittenLocks is a pawtastic WebApp to enchance your Chaster experience, built with ❤ by Silizia ~ Stella."/>
              <link rel="manifest" href="/manifest.webmanifest"/>
              <link rel="apple-touch-icon" sizes="192x192" href="/appicon.png"/>
              <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap"/>
            </Helmet>
            <App/>
          </HelmetProvider>
        </RealmAppProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>, div
);