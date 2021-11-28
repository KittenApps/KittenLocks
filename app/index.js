import { PureComponent, StrictMode } from 'react';
import { render } from 'react-dom';
import { RealmAppProvider } from './RealmApp.js';
import App from './App';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

class ErrorBoundary extends PureComponent{
  constructor(props){
    super(props);
    this.state = { error: null, stack: null };
  }

  componentDidCatch(error, errorInfo){
    this.setState({ error, stack: errorInfo.componentStack });
  }

  render(){
    const { error, stack } = this.state;
    const { children } = this.props;
    if (error !== null) return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, padding: 10, overflow: 'scroll', color: '#ffffff', backgroundColor: '#272533' }}>
        <h1>Oops, something went wrong! :(</h1>
        <p><b>Please give the following information to a hard working tech kitten.</b></p>
        <textarea readOnly style={{ width: '100%', height: 300, backgroundColor: '#343241', color: '#ffffff' }} value={`\`\`\`${error.toString()}${stack}\`\`\``}/>
        <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777378262474815" title="Discord" width="100%" height="500" allowtransparency="true" frameBorder="0"/>
      </div>
    );
    return children;
  }
}

const div = document.createElement('div');
document.body.append(div);

render(
  <StrictMode>
    <ErrorBoundary>
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
              <meta property="og:url" content="https://kittenlocks.netlify.app/"/>
              <meta property="og:image" content="https://kittenlocks.netlify.app/appicon.png"/>
              <meta property="og:description" content="KittenLocks is a pawtastic WebApp to enchance your Chaster experience, built with ❤ by Silizia ~ Stella."/>
              <link rel="manifest" href="/manifest.webmanifest"/>
              <link rel="apple-touch-icon" sizes="192x192" href="/appicon.png"/>
              <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap"/>
            </Helmet>
            <App/>
          </HelmetProvider>
        </RealmAppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>, div
);