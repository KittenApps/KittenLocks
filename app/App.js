import { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Alert, AlertTitle, Box, Button, CssBaseline, IconButton, Paper, Stack, TextField, Toolbar, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';
import { Route, Routes, useSearchParams } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ErrorBoundary } from '@sentry/react';
import { useRealmApp } from './RealmApp';
import AppHeader from './components/AppHeader';
import AppDrawer from './components/AppDrawer';
import RequiredScopes from './components/RequiredScopes';
import Login from './components/LoginModal';
import Home from './views/Home';
const MyLock = lazy(() => import(/* webpackChunkName: "my_lock" */ './views/MyLock'));
const MyWearer = lazy(() => import(/* webpackChunkName: "my_wearer" */ './views/MyWearers'));
const PublicLocks = lazy(() => import(/* webpackChunkName: "public_locks" */ './views/PublicLocks'));
const PublicLock = lazy(() => import(/* webpackChunkName: "public_locks" */ './views/PublicLock'));
const PublicCharts = lazy(() => import(/* webpackChunkName: "public_charts" */ './views/PublicCharts'));
const LockTransfer = lazy(() => import(/* webpackChunkName: "lock_transfer" */ './views/LockTransfer'));

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

function App(){
  const app = useRealmApp();
  const notistackRef = useRef(null);

  const theme = createTheme({
    palette: {
      primary: {
        main: '#6d7dd1'
      },
      secondary: {
        main: '#6d7dd1'
      },
      appBar: {
        main: '#1a1629'
      },
      background: {
        default: '#272533',
        paper: '#1f1d2b'
      },
      mode: 'dark'
    }
  });

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [open, setOpen] = useState(isDesktop);

  const [searchParams, setSearchParams] = useSearchParams();
  const [logScopes, setLogScopes] = useState(() => {
    let l = searchParams.get('login')?.split(',').filter(x => ks.has(x)) || [];
    if (app.currentUser?.customData?.scopes) l = l.filter(x => !app.currentUser?.customData?.scopes.includes(x));
    return l;
  });
  const handleLoginModalClose = useCallback(() => {
    setLogScopes([]);
    const p = {};
    for (const [k, v] of searchParams.entries()){
      if (k !== 'login') p[k] = v;
    }
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const [openLogin, showLogin] = useState(logScopes.length > 0);

  const notistackClose = useCallback(key => {
    const handleNotistackClose = k => () => notistackRef.current.closeSnackbar(k);
    return <IconButton onClick={handleNotistackClose(key)} color="inherit" size="small"><Close fontSize="inherit"/></IconButton>;
  }, []);
  const onMissingScopes = useCallback(s => {setLogScopes(s); showLogin(true);}, []);

  const installPromptAction = useCallback(prompt => {
    const handleNotistackClose = k => () => notistackRef.current.closeSnackbar(k);
    const handlePromp = k => () => {prompt(); notistackRef.current.closeSnackbar(k);};
    return function installAction(key){
      return (
        <Stack spacing={1} direction="row">
          <Button color="inherit" variant="outlined" onClick={handlePromp(key)} size="small">Install now</Button>
          <IconButton color="inherit" onClick={handleNotistackClose(key)} size="small"><Close fontSize="inherit"/></IconButton>
        </Stack>
      );
    };
  }, [notistackRef]);

  useEffect(() => window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    notistackRef.current.enqueueSnackbar('Add KittenLocks to your HomeScreen?', { variant: 'info', action: installPromptAction(e.prompt) });
  }), [installPromptAction]);

  const [subNav, setSubNav] = useState(null);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider ref={notistackRef} autoHideDuration={15000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} dense={!isDesktop} action={notistackClose}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline/>
          { openLogin && <Login showLogin={showLogin} rScopes={logScopes} onMissingScopes={onMissingScopes} onClose={handleLoginModalClose}/>}
          <AppHeader isDesktop={isDesktop} app={app} setOpen={setOpen} showLogin={showLogin}/>
          <AppDrawer isDesktop={isDesktop} open={open} setOpen={setOpen} subNav={subNav}/>
          <Main open={open} isDesktop={isDesktop}>
            <Toolbar/>
            <ErrorBoundary fallback={ErrorFallback} showDialog>
              <Routes>
                <Route
                  path="lock/*"
                  element={
                    <RequiredScopes rScopes={['locks']} onMissingScopes={onMissingScopes} component="lock">
                      <Suspense fallback={<p>loading...</p>}><MyLock setSubNav={setSubNav}/></Suspense>
                    </RequiredScopes>
                  }
                />
                <Route
                  path="wearers/*"
                  element={
                    <RequiredScopes rScopes={['keyholder']} onMissingScopes={onMissingScopes} component="wearer">
                      <Suspense fallback={<p>loading...</p>}><MyWearer setSubNav={setSubNav}/></Suspense>
                    </RequiredScopes>
                  }
                />
                <Route path="locks" element={<Suspense fallback={<p>loading...</p>}><PublicLocks isDesktop={isDesktop}/></Suspense>}>
                  <Route path=":username/*" element={<Suspense fallback={<p>loading...</p>}><PublicLock setSubNav={setSubNav} isDesktop={isDesktop}/></Suspense>}/>
                </Route>
                <Route
                  path="charts/*"
                  element={
                    /* <RequiredScopes rScopes={[]} onMissingScopes={onMissingScopes} component="charts"> */
                    <Suspense fallback={<p>loading...</p>}><PublicCharts/></Suspense>
                    /* </RequiredScopes> */
                  }
                />
                <Route
                  path="trans/*"
                  element={
                    <RequiredScopes rScopes={['locks']} onMissingScopes={onMissingScopes} component="trans">
                      <Suspense fallback={<p>loading...</p>} ><LockTransfer/></Suspense>
                    </RequiredScopes>
                  }
                />
                <Route
                  path="discord/*"
                  element={
                    <Paper elevation={6} sx={{ position: 'absolute', backgroundColor: '#1b192a', top: isDesktop ? 80 : 64, left: isDesktop ? (open ? 256 : 16) : 0, right: isDesktop ? 16 : 0, bottom: isDesktop ? 16 : 0, p: 2 }} >
                      <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777377968869465" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"/>
                    </Paper>
                  }
                />
                <Route path="*" element={<Home/>} />
              </Routes>
            </ErrorBoundary>
          </Main>
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default memo(App);