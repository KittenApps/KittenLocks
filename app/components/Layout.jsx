import { memo, useCallback, useContext, useState } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { styled } from '@mui/material/styles';
import { Alert, AlertTitle, Box, Button, CssBaseline, TextField, Toolbar, useMediaQuery } from '@mui/material';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useRealmApp } from '../RealmApp';
import { SubNavContext } from '../SubNavContext';
import AppHeader from './AppHeader';
import AppDrawer from './AppDrawer';
import Login from './LoginModal';

const drawerWidth = 250;
const ks = new Set(['profile', 'offline_access', 'email', 'locks', 'keyholder', 'shared_locks', 'messaging']);

const Main = styled('main', { shouldForwardProp: p => p !== 'open' && p !== 'isDesktop' })(({ theme, open, isDesktop }) => ({
  flexGrow: 1,
  ...(isDesktop && {
    padding: theme.spacing(2),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      }),
      marginLeft: 0
    })
  })
}));

function ErrorFallback({ error, componentStack, resetError }){
  return (
    <Alert severity="error" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
      <AlertTitle>Oops, something went wrong! :(</AlertTitle>
      <p><b>Please give the following information to a hard working tech kitten.</b></p>
      <TextField multiline fullWidth label="Error message" InputProps={{ readOnly: true }} value={`\`\`\`\n${error.toString()}${componentStack}\n\`\`\``}/>
      <Button variant="contained" onClick={resetError} fullWidth sx={{ mt: 1 }}>Try to reset invalid user input state and go back ...</Button>
    </Alert>
  );
}

function RootTemplate(){
  const app = useRealmApp();
  const { subNav } = useContext(SubNavContext);
  const isDesktop = useMediaQuery(theme => theme.breakpoints.up('md'), { noSsr: true });
  const [open, setOpen] = useState(isDesktop);

  const [searchParams, setSearchParams] = useSearchParams();
  const [logScopes, setLogScopes] = useState(() => {
    let l = searchParams.get('login')?.split(',').filter(x => ks.has(x)) || [];
    if (app.currentUser?.customData?.scopes) l = l.filter(x => !app.currentUser?.customData?.scopes.includes(x));
    return l;
  });
  const [openLogin, showLogin] = useState(logScopes.length > 0);
  const onMissingScopes = useCallback(s => {setLogScopes(s); showLogin(true);}, []);

  const handleLoginModalClose = useCallback(() => {
    setLogScopes([]);
    const p = {};
    for (const [k, v] of searchParams.entries()){
      if (k !== 'login') p[k] = v;
    }
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  return (
    <Box display="flex">
      <CssBaseline/>
      { openLogin && <Login showLogin={showLogin} rScopes={logScopes} onMissingScopes={onMissingScopes} onClose={handleLoginModalClose}/>}
      <AppHeader isDesktop={isDesktop} open={open} setOpen={setOpen} showLogin={showLogin}/>
      <AppDrawer isDesktop={isDesktop} open={open} setOpen={setOpen} subNav={subNav}/>
      <Main open={open} isDesktop={isDesktop}>
        <Toolbar/>
        <ErrorBoundary fallback={ErrorFallback} showDialog>
          <Outlet context={onMissingScopes}/>
        </ErrorBoundary>
      </Main>
    </Box>
  );
}

export default memo(RootTemplate);