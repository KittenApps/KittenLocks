import { Suspense, lazy, memo, useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, IconButton, Stack, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { SnackbarProvider, useSnackbar } from 'notistack';
import Home from './views/Home';
import Discord from './views/Discord';
import Support from './views/Support';
import LoadingPage from './components/LoadingPage';
import RootTemplate from './components/RootTemplate';
const MyLock = lazy(() => import(/* webpackChunkName: "my_lock" */ './views/MyLock'));
const MyWearer = lazy(() => import(/* webpackChunkName: "my_wearer" */ './views/MyWearers'));
const PublicLocks = lazy(() => import(/* webpackChunkName: "public_locks" */ './views/PublicLocks'));
const PublicLock = lazy(() => import(/* webpackChunkName: "public_locks" */ './views/PublicLock'));
const ChasterEvent = lazy(() => import(/* webpackChunkName: "chaster_event" */ './views/ChasterEvent'));
const PublicCharts = lazy(() => import(/* webpackChunkName: "public_charts" */ './views/PublicCharts'));
const LockTransfer = lazy(() => import(/* webpackChunkName: "lock_transfer" */ './views/LockTransfer'));

const InstallAction = memo(({ index, installPrompt }) => {
  const { closeSnackbar } = useSnackbar();
  const handleNotistackClose = useCallback(() => closeSnackbar(index), [index, closeSnackbar]);
  const handlePromp = useCallback(() => {installPrompt.prompt(); closeSnackbar(index);}, [closeSnackbar, index, installPrompt]);
  return (
    <Stack spacing={1} direction="row">
      <Button color="inherit" variant="outlined" onClick={handlePromp} size="small">Install now</Button>
      <IconButton color="inherit" onClick={handleNotistackClose} size="small"><Close fontSize="inherit"/></IconButton>
    </Stack>
  );
});
InstallAction.displayName = 'installAction';

function App(){
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

  const notistackClose = useCallback(index => {
    const handleNotistackClose = k => () => notistackRef.current.closeSnackbar(k);
    return <IconButton onClick={handleNotistackClose(index)} color="inherit" size="small"><Close fontSize="inherit"/></IconButton>;
  }, []);

  const [installPrompt, setInstallPrompt] = useState(null);
  const installPromptAction = useCallback(index => <InstallAction index={index} installPrompt={installPrompt}/>, [installPrompt]);
  useEffect(() => {
    if (installPrompt) notistackRef.current.enqueueSnackbar('Add KittenLocks to your HomeScreen?', { variant: 'info', action: installPromptAction });
  }, [installPrompt, installPromptAction]);
  const handleInstallPrompt = useCallback(e => {
    e.preventDefault();
    setInstallPrompt(e);
  }, []);
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, [handleInstallPrompt]);

  const [subNav, setSubNav] = useState(null);
  const router = createBrowserRouter([
    {
      path: '/*',
      element: <RootTemplate isDesktop={isDesktop} subNav={subNav}/>,
      children: [
        { path: 'lock/*', element: <Suspense fallback={<p>loading...</p>}><MyLock setSubNav={setSubNav}/></Suspense> },
        { path: 'wearers/*', element: <Suspense fallback={<p>loading...</p>}><MyWearer setSubNav={setSubNav}/></Suspense> },
        {
          path: 'locks',
          element: <Suspense fallback={<p>loading...</p>}><PublicLocks isDesktop={isDesktop}/></Suspense>,
          children: [{ path: ':username/*', element: <Suspense fallback={<p>loading...</p>}><PublicLock setSubNav={setSubNav} isDesktop={isDesktop}/></Suspense> }]
        },
        { path: 'event/*', element: <Suspense fallback={<p>loading...</p>}><ChasterEvent/></Suspense> }, // move suspense outside routerProvider
        { path: 'charts/*', element: <Suspense fallback={<p>loading...</p>}><PublicCharts/></Suspense> },
        { path: 'trans/*', element: <Suspense fallback={<p>loading...</p>} ><LockTransfer/></Suspense> },
        { path: 'discord/*', element: <Discord open={open}/> },
        { path: 'support/*', element: <Support/> },
        { path: '*', element: <Home/> }
      ]
    }
  ]);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider ref={notistackRef} autoHideDuration={15000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} dense={!isDesktop} action={notistackClose}>
        <RouterProvider router={router} fallbackElement={<LoadingPage/>}/>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default memo(App);