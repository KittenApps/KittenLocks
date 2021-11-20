import { useState, Fragment } from "react";
import { Credentials } from "realm-web";
import { useRealmApp } from "../RealmApp";
import { useSearchParams } from "react-router-dom";
import { Button, Paper, Stack, Avatar } from '@mui/material';

// ToDo: Select scopes beyond required scopes
// ToDo: Keeps at least all old scopes

export function ScopeBadges(props){
  const p = props.scopes.includes('profile') ? 'lightblue' : 'grey';
  const l = props.scopes.includes('locks') ? 'hotpink' : 'grey';
  const k = props.scopes.includes('keyholder') ? 'violet' : 'grey';
  return (
    <Stack direction="row" spacing={0.5}>
      { props.title && (<strong>{props.title} </strong>) }
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: p }} >P</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: l }} >L</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: k }} >K</Avatar>
    </Stack>
  )
}

export function LoginButton(props){
  const app = useRealmApp();

  const handleLogin = () => {
    const state = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const redUrl = process.env.CI ? 'https://kittenlocks.netlify.app/static/html/oauthcb' : 'http://localhost:8080/static/html/oauthcb';
    window.open('https://sso.chaster.app/auth/realms/app/protocol/openid-connect/auth?client_id=kittenlocks-870504' +
                `&redirect_uri=${encodeURIComponent(redUrl)}&response_type=code&scope=${props.scopes.join('%20')}&state=${state}`,
                'Chaster Login', 'scrollbars=on,location=off,width=1000,height=500,left=200,top=200');
    window.addEventListener('message', e => {
      if (e.data.authCode && state === e.data.state){
        e.source.close();
        app.logIn(Credentials.function({ authCode: e.data.authCode, redUrl }));
      } else if ( e.data.authCode === null ) {
        e.source.close();
        setTimeout(() => alert('Login failed: You need to accept the Chaster OAuth request!'), 1);
      }
    }, false);
  }
  return <Button variant="contained" onClick={handleLogin}>Login with Chaster ...</Button>;
}

export function RequireLoggedInScope(props){
  const app = useRealmApp();
  const scopes = app.currentUser?.customData?.scopes;
  if (scopes && props.scopes.every(s => scopes.includes(s))){
    return props.children;
  }
  return (
    <Paper elevation={3} >
      <Stack spacing={2}>
        <span>{ app.currentUser ? <ScopeBadges scopes={app.currentUser.customData.scopes} title="Provided scopes:"></ScopeBadges> : <strong>'Login required!'</strong> }</span>
        <ScopeBadges scopes={props.scopes} title="Needed scopes:"></ScopeBadges>
        <LoginButton scopes={props.scopes}/>
      </Stack>
    </Paper>
  );
}

export default function Login(){
  let [searchParams, setSearchParams] = useSearchParams();
  return (
    <Fragment>
      <h2>Login with Chaster</h2>
    </Fragment>
  );
}