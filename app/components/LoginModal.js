import { useState } from 'react';
import { Credentials } from 'realm-web';
import { useRealmApp } from '../RealmApp';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Button, Dialog, DialogActions,
         DialogContent, DialogTitle, FormControlLabel, FormGroup, FormHelperText, Stack, Switch, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ScopeBadges from './ScopeBadges';

export default function Login(props){
  const app = useRealmApp();
  const savScopes = localStorage.getItem('scopes')?.split(',');
  const exScopes = app.currentUser?.customData?.scopes || savScopes || [];
  const reqScopes = ['profile', ...props.scopes] || [];
  const misScopes = reqScopes.filter(s => !app.currentUser?.customData?.scopes.includes(s));
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const componentMap = { lock: 'My Lock Profile', trans: 'Lock Transfer' };
  const scopeMap = { profile: 'Your Identity (profile)', locks: 'Your Locks (locks)', keyholder: 'Your Keyholding (keyholder)', 'shared_locks': 'Your Shared Locks (shared_locks)', messaging: 'Your Messaging (messaging)' };

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
        props.setAlert({ type: 'error', child: <><b>Login failed:</b>You need to accept the Chaster OAuth request!</> });
      }
    }, false);
  };
  const handleAbort = () => (props.showLogin ? props.showLogin(false) : navigate('/'));
  // if component info box with requires scopes
  // ToDo: Warn if not having all granted scopes
  return (
    <Dialog fullScreen={fullScreen} open={props.open !== false}>
      <DialogTitle>{app.currentUser ? 'Manage Chaster permissions' : 'Login with Chaster'}</DialogTitle>
      <DialogContent dividers>
        { props.component && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between"><AlertTitle>{app.currentUser ? 'Missing Chaster scopes' : 'Chaster Login required'}</AlertTitle><ScopeBadges scopes={reqScopes}/></Stack>
            You need {app.currentUser ? 'to grant these additional Chaster' : 'a Chaster Login with the following'} scopes to use <b>{componentMap[props.component]}</b>:
            <ul style={{ margin: '7px 0' }}>
              { misScopes.map(s => <li key={s}>{scopeMap[s]}</li>)}
            </ul>
          </Alert>
        )}
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Please select the <b>Chaster scopes</b> you want to grant <b>KittenLocks</b> below:</span>
        <FormGroup sx={{ my: 2, ml: 2 }}>
          <FormControlLabel disabled control={<Switch defaultChecked />} label={scopeMap.profile}/>
          <FormHelperText disabled sx={{ mb: 1, mt: 0 }}>to access your Chaster identity, linked to your KittenLocks account (always required to login)</FormHelperText>
          <FormControlLabel disabled={reqScopes.includes('locks')} onChange={handleChange('locks')} checked={scopes.has('locks')} control={<Switch/>} label={scopeMap.locks}/>
          <FormHelperText disabled sx={{ mb: 1, mt: 0 }}>to access the data and manage your Chaster locks</FormHelperText>
          <FormControlLabel disabled={reqScopes.includes('keyholder')} onChange={handleChange('keyholder')} checked={scopes.has('keyholder')} control={<Switch/>} label={scopeMap.keyholder}/>
          <FormHelperText disabled sx={{ mt: 0 }}>to access the data and manage your Chaster lockees</FormHelperText>
        </FormGroup>
        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>more advanced scopes</AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <FormControlLabel disabled={reqScopes.includes('shared_locks')} onChange={handleChange('shared_locks')} checked={scopes.has('shared_locks')} control={<Switch/>} label={scopeMap.shared_locks}/>
              <FormHelperText disabled sx={{ mb: 1, mt: 0 }}>to access and manage your Chaster shared locks</FormHelperText>
              <FormControlLabel disabled={reqScopes.includes('messaging')} onChange={handleChange('messaging')} checked={scopes.has('messaging')} control={<Switch/>} label={scopeMap.messaging}/>
              <FormHelperText disabled sx={{ mt: 0 }}>to access your Chaster messaging</FormHelperText>
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        <FormHelperText sx={{ mt: 2 }}>By clicking <b>{app.currentUser ? 'Grant' : 'Login'} with Chaster</b>, you'll be directed to the <b>Chaster OAuth form</b> to {app.currentUser ? 'grant' : 'login'} the <b>KittenLocks</b> webapp {app.currentUser ? 'access to' : 'with'} your <b>Chaster</b> account with the selected <b>scopes</b>.</FormHelperText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleLogin}>{app.currentUser ? 'Grant' : 'Login'} with Chaster...</Button>
        <Button variant="outlined" onClick={handleAbort}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}