import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Credentials } from 'realm-web';
import { useRealmApp } from '../RealmApp';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Backdrop, Button, CircularProgress, Dialog, DialogActions,
         DialogContent, DialogTitle, FormControlLabel, FormGroup, FormHelperText, IconButton, Stack, Switch, useMediaQuery } from '@mui/material';
import { useSnackbar } from 'notistack';
import { Close, ExpandMore } from '@mui/icons-material';
import ScopeBadges from './ScopeBadges';

const componentMap = { lock: 'My Lock Profile', wearer: 'My Wearers Locks', charts: 'Public Lock Charts', trans: 'Lock Transfer' };
const scopeMap = { profile: 'Your Identity (profile)', locks: 'Your Locks (locks)', keyholder: 'Your Keyholding (keyholder)', 'shared_locks': 'Your Shared Locks (shared_locks)', messaging: 'Your Messaging (messaging)' };

const ScopeSwitch = memo(({ s, scopes, setScopes, reqScopes, val, mb, text, i }) => {
  const handleChange = useCallback(e => {
    const set = new Set(scopes);
    if (e.target.checked) return setScopes(set.add(s));
    set.delete(s);
    setScopes(set);
  }, [s, scopes, setScopes]);
  return (
    <>
      <FormControlLabel disabled={reqScopes.includes(s)} onChange={handleChange} checked={scopes.has(s)} control={<Switch color={val[i] === 0 ? 'primary' : (val[i] === 1 ? 'warning' : 'success')}/>} label={scopeMap[s]}/>
      <FormHelperText disabled sx={{ mb, mt: 0 }}>to access {text} { val[i] > 0 && <b>({val[i] === 1 ? 'required' : (val[i] === 3 ? 'granted' : 'additionally granted')})</b>}</FormHelperText>
    </>
  );
});
ScopeSwitch.displayName = 'ScopeSwitch';

// eslint-disable-next-line complexity
function Login({ rScopes, component, onMissingScopes, showLogin, onClose }){
  const app = useRealmApp();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const savScopes = useMemo(() => localStorage.getItem('scopes')?.split(','), []);
  const exScopes = useMemo(() => app.currentUser?.customData?.scopes || savScopes || [], [app.currentUser?.customData?.scopes, savScopes]);
  const reqScopes = useMemo(() => ['profile', ...(rScopes || [])], [rScopes]);
  const misScopes = useMemo(() => reqScopes.filter(s => !app.currentUser?.customData?.scopes.includes(s)), [app.currentUser?.customData?.scopes, reqScopes]);
  const fullScreen = useMediaQuery(theme => theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const val = useMemo(() => ['profile', 'locks', 'keyholder', 'shared_locks', 'messaging'].map(s => {
    if (new Set(app.currentUser?.customData?.scopes).has(s)){
      if (new Set(reqScopes).has(s)) return 3;
      return component ? 2 : 3;
    }
    if (new Set(reqScopes).has(s)) return 1;
    return 0;
  }), [reqScopes, app.currentUser?.customData?.scopes, component]);

  const [scopes, setScopes] = useState(new Set([...exScopes, ...reqScopes]));

  const [advanced, setAdvanced] = useState(scopes.has('shared_locks') || scopes.has('messaging'));
  const handleAdvancedChange = useCallback(() => setAdvanced(!advanced), [advanced]);

  const missingScopesAction = useCallback(grantedScopes => {
    const handleNotistackClose = k => () => closeSnackbar(k);
    const handleMissingScopes = k => () => {onMissingScopes(grantedScopes); closeSnackbar(k);};
    return function missingScopes(key){
      return (
        <Stack spacing={1} direction="row">
          <Button color="inherit" variant="outlined" onClick={handleMissingScopes(key)} size="small">Upgrade scopes</Button>
          <IconButton color="inherit" onClick={handleNotistackClose(key)} size="small"><Close fontSize="inherit"/></IconButton>
        </Stack>
      );
    };
  }, [closeSnackbar, onMissingScopes]);

  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(() => {
    const state = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const ks = new Set(['profile', 'offline_access', 'email', 'locks', 'keyholder', 'shared_locks', 'messaging']);
    const sc = ['profile', 'offline_access', ...scopes].filter(x => ks.has(x)).join('%20');
    const redUrl = `${window.location.origin}/static/html/oauthcb/`;
    const rUrl = encodeURIComponent(redUrl);
    window.open(
      `https://sso.chaster.app/auth/realms/app/protocol/openid-connect/auth?client_id=kittenlocks-870504&redirect_uri=${rUrl}&response_type=code&scope=${sc}&state=${state}`,
      'Chaster Login',
      'scrollbars=on,location=off,width=1000,height=500,left=200,top=200'
    );
    window.addEventListener('message', e => {
      if (e.origin !== window.location.origin) return;
      if (e.data.authCode && state === e.data.state){
        e.source.close();
        app.logIn(Credentials.function({ authCode: e.data.authCode, redUrl }));
        localStorage.setItem('scopes', [...scopes].join(','));
        setLoading(true);
      } else if (e.data.authCode === null){
        e.source.close();
        enqueueSnackbar('Login failed: You need to accept the Chaster OAuth request!', { variant: 'error' });
      }
    }, false);
  }, [app, enqueueSnackbar, scopes]);
  useEffect(() => {
    const u = app.currentUser?.customData;
    if (u && loading){
      const mis = u.grantedScopes.filter(x => !new Set(u.scopes).has(x));
      if (mis.length > 0) enqueueSnackbar('Missing granted scopes: You\'re not using all your already granted scopes :(', { variant: 'warning', action: missingScopesAction(u.grantedScopes) });
      if (showLogin) showLogin(false);
    }
  }, [app.currentUser?.customData, enqueueSnackbar, loading, missingScopesAction, showLogin]);
  const handleAbort = useCallback(() => {
    if (onClose){
      onClose();
      showLogin(false);
    } else navigate('/');
  }, [onClose, navigate, showLogin]);

  if (loading) return <Backdrop sx={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: t => t.zIndex.drawer + 1 }} open><CircularProgress color="inherit"/></Backdrop>;

  return (
    <Dialog fullScreen={fullScreen} BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }} open>
      <DialogTitle>{app.currentUser ? 'Manage Chaster permissions' : 'Login with Chaster'}</DialogTitle>
      <DialogContent dividers>
        { component && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Stack direction="row" justifyContent="space-between"><AlertTitle>{app.currentUser ? 'Missing Chaster scopes' : 'Chaster Login required'}</AlertTitle><ScopeBadges scopes={reqScopes} r/></Stack>
            You need {app.currentUser ? 'to grant these additional Chaster' : 'a Chaster Login with the following'} scopes to use <b>{componentMap[component]}</b>:
            <ul style={{ margin: '7px 0' }}>
              { misScopes.map(s => <li key={s}>{scopeMap[s]}</li>)}
            </ul>
          </Alert>
        )}
        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Please select the <b>Chaster scopes</b> you want to grant <b>KittenLocks</b> below:</span>
        <FormGroup sx={{ my: 2, ml: 2 }}>
          <FormControlLabel disabled control={<Switch defaultChecked color={val[0] === 0 ? 'primary' : (val[0] === 1 ? 'warning' : 'success')}/>} label={scopeMap.profile}/>
          <FormHelperText disabled sx={{ mb: 1, mt: 0 }}>to access your Chaster identity, linked to your KittenLocks account { val[0] && <b>({val[0] > 1 ? 'granted' : 'always required to login'})</b>}</FormHelperText>
          <ScopeSwitch s="locks" i={1} mb={1} text="the data and manage your Chaster locks" scopes={scopes} setScopes={setScopes} reqScopes={reqScopes} val={val}/>
          <ScopeSwitch s="keyholder" i={2} mb={0} text="the data and manage your Chaster lockees" scopes={scopes} setScopes={setScopes} reqScopes={reqScopes} val={val}/>
        </FormGroup>
        <Accordion expanded={advanced} onChange={handleAdvancedChange} disableGutters>
          <AccordionSummary expandIcon={<ExpandMore/>}>more advanced scopes</AccordionSummary>
          <AccordionDetails>
            <FormGroup>
              <ScopeSwitch s="shared_locks" i={3} mb={1} text="and manage your Chaster shared locks" scopes={scopes} setScopes={setScopes} reqScopes={reqScopes} val={val}/>
              <ScopeSwitch s="messaging" i={4} mb={0} text="your Chaster messaging" scopes={scopes} setScopes={setScopes} reqScopes={reqScopes} val={val}/>
            </FormGroup>
          </AccordionDetails>
        </Accordion>
        <FormHelperText sx={{ mt: 2 }}>
          By clicking <b>{app.currentUser ? 'Grant' : 'Login'} with Chaster</b>, you'll be directed to the <b>Chaster OAuth form</b> to {app.currentUser ? 'grant' : 'login'} the <b>KittenLocks</b> webapp {app.currentUser ? 'access to' : 'with'} your <b>Chaster</b> account with the selected <b>scopes</b>.
        </FormHelperText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleLogin}>{app.currentUser ? 'Grant' : 'Login'} with Chaster...</Button>
        <Button variant="outlined" onClick={handleAbort}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(Login);