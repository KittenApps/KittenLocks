import { Suspense, forwardRef, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useRealmApp } from './RealmApp';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Alert, AlertTitle, AppBar, Avatar, Backdrop, Box, Button, CardHeader, CssBaseline, Divider, Drawer, IconButton, Link, List, ListItemButton,
         ListItemIcon, ListItemText, Menu, MenuItem, Paper, Stack, SwipeableDrawer, TextField, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import RequiredScopes from './components/RequiredScopes';
import ScopeBadges from './components/ScopeBadges';
import Login from './components/LoginModal';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import HomeIcon from '@mui/icons-material/HomeTwoTone';
import LockIcon from '@mui/icons-material/Lock';
import Lock2Icon from '@mui/icons-material/LockTwoTone';
import AddLockItem from '@mui/icons-material/EnhancedEncryptionTwoTone';
import ChartIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/CompareArrows';
import ChatIcon from '@mui/icons-material/ChatTwoTone';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Home from './views/Home';
import { ErrorBoundary } from '@sentry/react';
const MyLock = lazy(() => import(/* webpackChunkName: "my_lock" */ './views/MyLock'));
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

const NLink = forwardRef(({ ...props }, ref) => <NavLink ref={ref} {...props} className={({ isActive }) => [props.className, isActive ? 'Mui-selected' : null].filter(Boolean).join(' ')}/>);
NLink.displayName = 'NLink';

const drawerWidth = 240;

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

const StyledAppBar = styled(AppBar, { shouldForwardProp: p => p !== 'open' && p !== 'isDesktop' })(({ theme, open, isDesktop }) => ({
  ...(isDesktop && {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen
      })
    })
  })
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end'
}));

function ResponsiveDrawer({ isDesktop, open, handleDrawerOpen, handleDrawerClose, children }){
  if (isDesktop) return (
    <Drawer variant="persistent" anchor="left" open={open} sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
      <DrawerHeader>
        <IconButton onClick={handleDrawerClose}><ChevronLeftIcon/></IconButton>
      </DrawerHeader>
      <Divider />
      {children}
    </Drawer>
  );
  return <SwipeableDrawer sx={{ zIndex: 1350 }} anchor="left" open={open} onClose={handleDrawerClose} onOpen={handleDrawerOpen}>{children}</SwipeableDrawer>;
}

export default function App(){
  const app = useRealmApp();
  const navigate = useNavigate();
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
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleListClick = () => !isDesktop && setOpen(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = e => setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);
  const handleProfileMenuLogout = () => {
    navigate('/');
    app.logOut();
    setProfileMenuAnchorEl(null);
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const ks = new Set(['profile', 'offline_access', 'email', 'locks', 'keyholder', 'shared_locks', 'messaging']);
  const [logScopes, setLogScopes] = useState(() => {
    let l = searchParams.get('login')?.split(',').filter(x => ks.has(x)) || [];
    if (app.currentUser?.customData?.scopes) l = l.filter(x => !app.currentUser?.customData?.scopes.includes(x));
    return l;
  });
  const handleLoginModalClose = () => {
    setLogScopes([]);
    const p = {};
    for (const [k, v] of searchParams.entries()){
      if (k !== 'login') p[k] = v;
    }
    setSearchParams(p);
  };

  const [openLogin, showLogin] = useState(logScopes.length > 0);
  const handleLogin = () => showLogin(true);
  const handleManage = () => {handleLogin(); setProfileMenuAnchorEl(null);};

  const notistackClose = useCallback(key => {
    const handleNotistackClose = k => () => notistackRef.current.closeSnackbar(k);
    return <IconButton onClick={handleNotistackClose(key)} color="inherit" size="small"><CloseIcon fontSize="inherit"/></IconButton>;
  }, []);
  const onMissingScopes = s => {setLogScopes(s); showLogin(true);};

  const installPromptAction = useCallback(prompt => {
    const handleNotistackClose = k => () => notistackRef.current.closeSnackbar(k);
    const handlePromp = k => () => {prompt(); notistackRef.current.closeSnackbar(k);};
    return function installAction(key){
      return (
        <Stack spacing={1} direction="row">
          <Button color="inherit" variant="outlined" onClick={handlePromp(key)} size="small">Install now</Button>
          <IconButton color="inherit" onClick={handleNotistackClose(key)} size="small"><CloseIcon fontSize="inherit"/></IconButton>
        </Stack>
      );
    };
  }, [notistackRef]);

  useEffect(() => window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    notistackRef.current.enqueueSnackbar('Add KittenLocks to your HomeScreen?', { variant: 'info', action: installPromptAction(e.prompt) });
  }), [installPromptAction]);

  return (
    <ThemeProvider theme={theme}><Backdrop open={Boolean(profileMenuAnchorEl)} sx={{ zIndex: 1201, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}/>
      <SnackbarProvider ref={notistackRef} autoHideDuration={15000} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} dense={!isDesktop} action={notistackClose}>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline/>
          { openLogin && <Login showLogin={showLogin} rScopes={logScopes} onMissingScopes={onMissingScopes} onClose={handleLoginModalClose}/>}
          <StyledAppBar open={open} isDesktop={isDesktop} >
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: { xs: 0, sm: 2 }, ...(open && { display: 'none' }) }}><MenuIcon /></IconButton>
              <Avatar src="/appicon.png" sx={{ width: 32, height: 32, display: { xs: 'none', sm: 'block' } }}/>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
                KittenLocks
              </Typography>
              { app.currentUser
                ? <CardHeader
                    sx={{ p: 0, cursor: 'pointer', '& .MuiCardHeader-action': { mt: 0 } }}
                    avatar={<Avatar src={app.currentUser.customData.avatarUrl}/>}
                    onClick={handleProfileMenuOpen}
                    action={<IconButton aria-label="settings" onClick={handleProfileMenuOpen}><MoreVertIcon/></IconButton>}
                    title={app.currentUser.customData.username}
                    titleTypographyProps={{ fontSize: 16 }}
                    subheader={<ScopeBadges scopes={app.currentUser.customData.scopes}/>}
                  />
                : <Button variant="contained" onClick={handleLogin} size="small">Login with Chaster</Button>}
              <Menu
                anchorEl={profileMenuAnchorEl}
                open={Boolean(profileMenuAnchorEl)}
                onClose={handleProfileMenuClose}
                sx={{ mt: 1 }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleManage}><ListItemIcon><ManageAccountsIcon/></ListItemIcon>Manage scopes</MenuItem>
                <MenuItem component={Link} href="https://chaster.app/settings/profile" target="_blank" rel="noopener"><ListItemIcon><SettingsIcon/></ListItemIcon>Chaster settings</MenuItem>
                <Divider/>
                <MenuItem onClick={handleProfileMenuLogout}><ListItemIcon><LogoutIcon/></ListItemIcon>Log out</MenuItem>
              </Menu>
            </Toolbar>
          </StyledAppBar>
          <ResponsiveDrawer open={open} isDesktop={isDesktop} handleDrawerClose={handleDrawerClose} handleDrawerOpen={handleDrawerOpen} >
            <List onClick={handleListClick}>
              <ListItemButton key={0} component={NLink} to="/">         <ListItemIcon><HomeIcon/></ListItemIcon>   <ListItemText primary="Home"/></ListItemButton>
              <Divider key={-1}/>
              <ListItemButton key={1} component={NLink} to="/lock">     <ListItemIcon><LockIcon/></ListItemIcon>   <ListItemText primary="My Lock Profile"/></ListItemButton>
              <ListItemButton key={2} component={NLink} to="/locks">    <ListItemIcon><Lock2Icon/></ListItemIcon>  <ListItemText primary="Public Lock Profiles"/></ListItemButton>
              <Divider key={-2}/>
              <ListItemButton key={3} component={NLink} to="/charts">   <ListItemIcon><ChartIcon/></ListItemIcon>  <ListItemText primary="Public Lock Charts"/></ListItemButton>
              <ListItemButton disabled key={4} component={NLink} to="/"><ListItemIcon><AddLockItem/></ListItemIcon><ListItemText primary="Voting Game"/></ListItemButton>
              <ListItemButton key={5} component={NLink} to="/trans">    <ListItemIcon><CompareIcon/></ListItemIcon><ListItemText primary="Lock Transfer"/></ListItemButton>
              <Divider key={-3}/>
              <ListItemButton key={6} component={NLink} to="/discord">  <ListItemIcon><ChatIcon/></ListItemIcon>   <ListItemText primary="Discord Community"/></ListItemButton>
            </List>
            <div style={{ flexGrow: 1 }}/>
            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', mb: 1 }}>KittenLocks v0.1 (<Link href={`https://github.com/KittenApps/KittenLocks/commit/${process.env.COMMIT_REF}`} target="_blank" rel="noreferrer">{process.env.COMMIT_REF.slice(0, 7)}</Link>)</Typography>
          </ResponsiveDrawer>
          <Main open={open} isDesktop={isDesktop}>
            <DrawerHeader/>
            <ErrorBoundary fallback={ErrorFallback} showDialog>
              <Routes>
                <Route
                  path="lock/*"
                  element={
                    <RequiredScopes rScopes={['locks']} onMissingScopes={onMissingScopes} component="lock">
                      <Suspense fallback={<p>loading...</p>}><MyLock/></Suspense>
                    </RequiredScopes>
                  }
                />
                <Route path="locks" element={<Suspense fallback={<p>loading...</p>}><PublicLocks isDesktop={isDesktop}/></Suspense>}>
                  <Route path=":username/*" element={<Suspense fallback={<p>loading...</p>}><PublicLock isDesktop={isDesktop}/></Suspense>}/>
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