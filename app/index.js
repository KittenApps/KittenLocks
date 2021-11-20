import { Fragment, PureComponent, StrictMode } from "react";
import { render } from "react-dom";
import { RealmAppProvider } from "./RealmApp.js";
import App from "./app";
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from "react-router-dom";

class ErrorBoundary extends PureComponent {
  constructor(props){
    super(props);
    this.state = { error: null, stack: null };
  }

  componentDidCatch(error, errorInfo){
    this.setState({ error, stack: errorInfo.componentStack });
  }

  render(){
    if (this.state.error !== null) {
      return (
        <Fragment>
          <h1>Oops, something went wrong! :(</h1>
          <p>
            <b>
              Please give the following information to a hard working tech kitten.
            </b>
          </p>
          <p>
            <u>Error: </u>
            {this.state.error.toString()}
          </p>
          <p>
            <u>Stack: </u>
            {this.state.stack}
          </p>
        </Fragment>
      );
    }
    return this.props.children;
  }
}

const div = document.createElement('div');
document.body.appendChild(div);

render(
<StrictMode><ErrorBoundary><BrowserRouter><RealmAppProvider><HelmetProvider>
<Helmet>
    <meta name="apple-mobile-web-app-capable" content="yes"/>
    <meta name="apple-mobile-web-app-status-bar-style" content="black"/>
    <meta name="theme-color" content="#1f1d2b"/>
    <meta name="description" content="a pawtastic WebApp to enchance your Chaster experience"/>
    <meta property="og:title" content="KittenLocks"/>
    <meta property="og:type" content="website"/>
    <meta property="og:url" content="https://kittenlocks.netlify.app/"/>
    <meta property="og:image" content="https://kittenlocks.netlify.app/appicon.png"/>
    <meta property="og:description" content="KittenLocks is a pawtastic WebApp to enchance your Chaster experience."/>
    <link rel="apple-touch-icon" sizes="192x192" href="/appicon.png"/>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap"/>
  </Helmet>
  <App/>
</HelmetProvider></RealmAppProvider></BrowserRouter></ErrorBoundary></StrictMode>, div);