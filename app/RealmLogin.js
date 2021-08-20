import * as React from "react";
import { useState, useEffect } from "react";
import * as Realm from "realm-web";
import { useRealmApp } from "./RealmApp";
import { Button, Paper, Stack } from '@material-ui/core';

export function LoginScreen(props) {
  const app = useRealmApp();

  const handleLogin = () => {
    const state = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const redUrl = process.env.NODE_ENV === 'production' ? 'https://kittenlocks.netlify.app/oauthcb' : 'http://localhost:5000/oauthcb';
    window.open('https://sso.chaster.app/auth/realms/app/protocol/openid-connect/auth?client_id=kittenlocks-870504' +
                `&redirect_uri=${encodeURIComponent(redUrl)}&response_type=code&scope=${props.scopes.join('%20')}&state=${state}`,
                'Chaster Login', 'scrollbars=on,location=off,width=1000,height=500,left=200,top=200');
    window.addEventListener('message', e => {
      if (e.data.authCode && state === e.data.state){
        e.source.close();
        app.logIn(Realm.Credentials.function({ authCode: e.data.authCode, redUrl }));
      }
    }, false);
  }
  return <Button variant="contained" onClick={handleLogin}>Login with Chaster ...</Button>;
}

export default function RequireLoggedInScope (props){
  const app = useRealmApp();
  const [scopes, setScopes] = useState(app.currentUser?.customData?.scopes);
  useEffect(() => {
    setScopes(app.currentUser?.customData?.scopes);
  }, [app.currentUser]);
  if (scopes && props.scopes.every(s => scopes.includes(s))){
    return props.children;
  }
  return (
    <Paper elevation={3} >
      <Stack spacing={2}>
        <span>{app.currentUser ? `Provided scopes: ${app.currentUser.customData.scopes.join(' ')}` : 'Login required!'}</span>
        <span>Needed scopes: {props.scopes.join(' ')}</span>
        <LoginScreen scopes={props.scopes}/>
      </Stack>
    </Paper>
  );
}