import { useState } from 'react';
import { Credentials } from 'realm-web';
import { useRealmApp } from '../RealmApp';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Button, Dialog, DialogActions, DialogContent,
         DialogTitle, FormControlLabel, FormGroup, Paper, Skeleton, Stack, Switch, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  );
}

export function RequireLoggedInScope(props){
  const app = useRealmApp();
  const scopes = app.currentUser?.customData?.scopes;

  if (scopes && props.scopes.every(s => scopes.includes(s))) return props.children;
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h2><Skeleton variant="text"/></h2>
      <Skeleton variant="rectangular" width="100%" height="300px"/>
      <Login scopes={props.scopes}/>
    </Paper>
  );
}

export default function Login(props){
  const app = useRealmApp();
  const savScopes = localStorage.getItem('scopes')?.split(',');
  const exScopes = app.currentUser?.customData?.scopes || savScopes || [];
  const reqScopes = props.scopes || [];
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [scopes, setScopes] = useState(new Set([...exScopes, ...(reqScopes)]));
  const handleChange = s => e => {
    const set = new Set(scopes);
    if (e.target.checked) return setScopes(set.add(s));
    set.delete(s);
    setScopes(set);
  };

  const handleLogin = () => {
    const state = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const ks = new Set(['profile', 'offline_access', 'email', 'locks', 'keyholder', 'shared_locks', 'messaging']);
    const sc = ['profile', 'offline_access', ...scopes].filter(x => ks.has(x));
    const redUrl = process.env.CI ? 'https://kittenlocks.netlify.app/static/html/oauthcb' : 'http://localhost:8080/static/html/oauthcb';
    window.open(
      'https://sso.chaster.app/auth/realms/app/protocol/openid-connect/auth?client_id=kittenlocks-870504' +
      `&redirect_uri=${encodeURIComponent(redUrl)}&response_type=code&scope=${sc.join('%20')}&state=${state}`,
      'Chaster Login',
      'scrollbars=on,location=off,width=1000,height=500,left=200,top=200'
    );
    window.addEventListener('message', e => {
      if (e.data.authCode && state === e.data.state){
        e.source.close();
        app.logIn(Credentials.function({ authCode: e.data.authCode, redUrl })).then(u => console.log(u.scopes, u.grantedScopes));
        localStorage.setItem('scopes', [...scopes].join(','));
        if (props.showLogin) props.showLogin(false);
      } else if (e.data.authCode === null){
        e.source.close();
        setTimeout(() => alert('Login failed: You need to accept the Chaster OAuth request!'), 1);
      }
    }, false);
  };
  const handleAbort = () => (props.showLogin ? props.showLogin(false) : navigate('/'));
  // if component info box with requires scopes
  // ToDo: Warn if not having all granted scopes
  return (
    <Dialog fullScreen={fullScreen} open={props.open !== false}>
      <DialogTitle>Login with Chaster</DialogTitle>
      <DialogContent>
        <FormGroup>
          <FormControlLabel disabled control={<Switch defaultChecked />} label="Profile" />
          <FormControlLabel disabled={reqScopes.includes('locks')} control={<Switch onChange={handleChange('locks')} checked={scopes.has('locks')}/>} label="Locks" />
          <FormControlLabel disabled={reqScopes.includes('keyholder')} control={<Switch onChange={handleChange('keyholder')} checked={scopes.has('keyholder')}/>} label="Keyholder" />
        </FormGroup>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>more advanced scopes</AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel disabled={reqScopes.includes('shared_locks')} control={<Switch onChange={handleChange('shared_locks')} checked={scopes.has('shared_locks')}/>} label="Shared Locks" />
              <FormControlLabel disabled={reqScopes.includes('messaging')} control={<Switch onChange={handleChange('messaging')} checked={scopes.has('messaging')}/>} label="Messaging" />
            </FormGroup>
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleLogin}>Login with Chaster...</Button>
        <Button variant="outlined" onClick={handleAbort}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}