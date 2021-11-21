import { Suspense, forwardRef, lazy, useState } from 'react';
import { useRealmApp } from './RealmApp';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { AppBar, Avatar, Backdrop, Box, Button, CardHeader, CssBaseline, Divider, Drawer, IconButton, Link, List,
         ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, SwipeableDrawer, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { NavLink, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
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
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import Login, { RequireLoggedInScope, ScopeBadges } from './components/Login'; // ToDo: lazy
import Home from './components/Home';
const MyLock = lazy(() => import(/* webpackChunkName: "my_lock" */ './components/MyLock'));
const PublicLocks = lazy(() => import(/* webpackChunkName: "public_locks" */ './components/PublicLocks'));
const PublicLock = lazy(() => import(/* webpackChunkName: "public_locks" */ './components/PublicLock'));
const LockTransfer = lazy(() => import(/* webpackChunkName: "lock_transfer" */ './components/LockTransfer'));

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

function ResponsiveDrawer(props){
  if (props.isDesktop) return (
    <Drawer variant="persistent" anchor="left" open={props.open} sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
      <DrawerHeader>
        <IconButton onClick={props.handleDrawerClose}><ChevronLeftIcon/></IconButton>
      </DrawerHeader>
      <Divider />
      {props.children}
    </Drawer>
  );
  return <SwipeableDrawer anchor="left" open={props.open} onClose={props.handleDrawerClose} onOpen={props.handleDrawerOpen}>{props.children}</SwipeableDrawer>;
}

export default function App(){
  const app = useRealmApp();
  const navigate = useNavigate();

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

  const [searchParams] = useSearchParams();
  const ks = new Set(['profile', 'offline_access', 'email', 'locks', 'keyholder', 'shared_locks', 'messaging']);
  let logScopes = searchParams.get('login')?.split(',').filter(x => ks.has(x)) || [];
  if (app.currentUser?.customData?.scopes) logScopes = logScopes.filter(x => !app.currentUser?.customData?.scopes.includes(x));

  const [openLogin, showLogin] = useState(logScopes.length > 0);
  const handleLogin = () => showLogin(true);
  const handleManage = () => {handleLogin(); setProfileMenuAnchorEl(null);};

  return (
    <ThemeProvider theme={theme}><Backdrop open={Boolean(profileMenuAnchorEl)} sx={{ zIndex: 1201 }}/>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline/>
        {openLogin && <Login showLogin={showLogin} scopes={logScopes}/>}
        <StyledAppBar open={open} isDesktop={isDesktop} >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: { xs: 0, sm: 2 }, ...(open && { display: 'none' }) }}><MenuIcon /></IconButton>
            <Avatar src="/appicon.png" sx={{ width: 32, height: 32, display: { xs: 'none', sm: 'block' } }}/>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
              KittenLocks
            </Typography>
            { app.currentUser
              ? <CardHeader
                  sx={{ p: 0, '& .MuiCardHeader-action': { mt: 0 } }}
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
            <ListItemButton key={1} component={NLink} to="/lock">     <ListItemIcon><LockIcon/></ListItemIcon>   <ListItemText primary="My lock profile"/></ListItemButton>
            <ListItemButton key={2} component={NLink} to="/locks">    <ListItemIcon><Lock2Icon/></ListItemIcon>  <ListItemText primary="Public lock profiles"/></ListItemButton>
            <Divider key={-2}/>
            <ListItemButton disabled key={3} component={NLink} to="/"><ListItemIcon><ChartIcon/></ListItemIcon>  <ListItemText primary="Public lock charts"/></ListItemButton>
            <ListItemButton disabled key={4} component={NLink} to="/"><ListItemIcon><AddLockItem/></ListItemIcon><ListItemText primary="Voting Game"/></ListItemButton>
            <ListItemButton key={5} component={NLink} to="/trans">    <ListItemIcon><CompareIcon/></ListItemIcon><ListItemText primary="Lock Transfer"/></ListItemButton>
            <Divider key={-3}/>
            <ListItemButton key={6} component={NLink} to="/discord">  <ListItemIcon><ChatIcon/></ListItemIcon>   <ListItemText primary="Discord Community"/></ListItemButton>
          </List>
        </ResponsiveDrawer>
        <Main open={open} isDesktop={isDesktop}>
          <DrawerHeader/>
          <Routes>
            <Route
              path="lock/*"
              element={
                <RequireLoggedInScope scopes={['locks']} component="lock">
                  <Suspense fallback={<p>loading...</p>}><MyLock/></Suspense>
                </RequireLoggedInScope>
              }
            />
            <Route path="locks" element={<Suspense fallback={<p>loading...</p>}><PublicLocks/></Suspense>}>
              <Route path=":username/*" element={<Suspense fallback={<p>loading...</p>}><PublicLock/></Suspense>}/>
            </Route>
            <Route
              path="trans/*"
              element={
                <RequireLoggedInScope scopes={['locks']} component="trans">
                  <Suspense fallback={<p>loading...</p>} ><LockTransfer/></Suspense>
                </RequireLoggedInScope>
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
        </Main>
      </Box>
    </ThemeProvider>
  );
}