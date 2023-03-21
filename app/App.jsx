import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, IconButton, Stack, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';
import { RouterProvider, createBrowserRouter, redirect } from 'react-router-dom';
import { wrapCreateBrowserRouter } from '@sentry/react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import { SubNavContext } from './SubNavContext';
import { useRealmApp } from './RealmApp';
import Home from './views/Home';
import Discord from './views/Discord';
import Support from './views/Support';
import LoadingPage from './components/LoadingPage';
import Layout from './components/Layout';

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
  const app = useRealmApp();
  const checkScopes = useCallback(rs => {
    const scopes = app.currentUser?.customData?.scopes;
    return () => {
      if (!scopes || !rs.every(s => scopes.includes(s))) throw redirect(`/?login=${rs.join(',')}`);
      return {};
    };
  }, [app.currentUser?.customData?.scopes]);
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
  const router = wrapCreateBrowserRouter(createBrowserRouter)([
    {
      path: '/',
      element: <Layout/>,
      children: [
        { index: true, Component: Home },
        { path: 'lock/*', lazy: () => import(/* webpackChunkName: "my_lock" */ './views/MyLock'), loader: checkScopes(['locks']) },
        { path: 'wearers/*', lazy: () => import(/* webpackChunkName: "my_wearer" */ './views/MyWearers'), loader: checkScopes(['keyholder']) },
        {
          path: 'locks',
          lazy: () => import(/* webpackChunkName: "public_locks" */ './views/PublicLocks'),
          children: [{ path: ':username/*', lazy: () => import(/* webpackChunkName: "public_locks" */ './views/PublicLock') }]
        },
        { path: 'event/*', lazy: () => import(/* webpackChunkName: "chaster_event" */ './views/ChasterEvent'), loader: checkScopes([]) },
        { path: 'charts/*', lazy: () => import(/* webpackChunkName: "public_charts" */ './views/PublicCharts') },
        { path: 'trans/*', lazy: () => import(/* webpackChunkName: "lock_transfer" */ './views/LockTransfer'), loader: checkScopes(['locks']) },
        { path: 'discord/*', Component: Discord },
        { path: 'support/*', Component: Support },
        { path: '*', loader: () => redirect('/') }
      ]
    }
  ]);

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider ref={notistackRef} autoHideDuration={15000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} dense={!isDesktop} action={notistackClose}>
        <SubNavContext.Provider value={{ subNav, setSubNav }}>
          <RouterProvider router={router} fallbackElement={<LoadingPage/>}/>
        </SubNavContext.Provider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default memo(App);