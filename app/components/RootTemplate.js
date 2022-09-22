import { memo, useCallback, useState } from 'react';
import { ErrorBoundary } from '@sentry/react';
import { styled } from '@mui/material/styles';
import { Box, CssBaseline, Toolbar } from '@mui/material';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useRealmApp } from '../RealmApp';
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

function RootTemplate({ isDesktop, subNav, ErrorFallback }){
  const app = useRealmApp();
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