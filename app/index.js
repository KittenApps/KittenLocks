import * as React from "react";
import { render } from "react-dom";
import { useRealmApp, RealmAppProvider } from "./RealmApp.js";
import App from "./app";
import { BrowserRouter } from "react-router-dom";

export const APP_ID = "kittenlocks-gcfgb";

class ErrorBoundary extends React.PureComponent {
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
        <React.Fragment>
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
        </React.Fragment>
      );
    }
    return this.props.children;
  }
}

const div = document.createElement('div');
document.body.appendChild(div);

const link = document.createElement('link');
link.rel = "stylesheet";
link.href = "https://fonts.googleapis.com/css?family=Roboto:300,400&display=swap";
document.body.appendChild(link);

render(<React.StrictMode><BrowserRouter><ErrorBoundary><RealmAppProvider appId={APP_ID}><App/></RealmAppProvider></ErrorBoundary></BrowserRouter></React.StrictMode>, div);