import { useState, lazy, forwardRef, Fragment, Suspense } from "react";
import { useRealmApp } from "./RealmApp";
import { styled, ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, IconButton, CardHeader, Avatar, Menu, MenuItem, Box, useMediaQuery, SwipeableDrawer,
         Paper, Drawer, CssBaseline, List, ListItemButton, ListItemIcon, ListItemText, Divider, Link } from '@mui/material';
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
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
import { RequireLoggedInScope, LoginButton, ScopeBadges } from './RealmLogin';
const MyLock = lazy(() =>
  import(/* webpackChunkName: "my_lock" */ "./components/MyLock")
);
const PublicLocks = lazy(() =>
  import(/* webpackChunkName: "public_locks" */ "./components/PublicLocks")
);
const PublicLock = lazy(() =>
  import(/* webpackChunkName: "public_locks" */ "./components/PublicLock")
);
const LockTransfer = lazy(() =>
  import(/* webpackChunkName: "lock_transfer" */ "./components/LockTransfer")
);

const NLink = forwardRef(
  ({ ...props }, ref) => <NavLink ref={ref} {...props} className={({ isActive }) => [props.className, isActive ? 'Mui-selected' : null].filter(Boolean).join(' ')}/>
);

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(2),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StyledAppBar = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })
  (({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

function ResponsiveDrawer(props){
  if (props.isDesktop){
    return (
      <Drawer variant="persistent" anchor="left" open={props.open} sx={{width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': {width: drawerWidth, boxSizing: 'border-box'}}}>
        <DrawerHeader>
          <IconButton onClick={props.handleDrawerClose}><ChevronLeftIcon/></IconButton>
        </DrawerHeader>
        <Divider />
        {props.children}
      </Drawer>
    );
  } 
  return <SwipeableDrawer anchor="left" open={props.open} onClose={props.handleDrawerClose} onOpen={props.handleDrawerOpen}>{props.children}</SwipeableDrawer>;
}

function ResponsiveMain(props){
  if (props.isDesktop){
    return <Main open={props.open}>{props.children}</Main>;
  }
  return <main style={{flexGrow: 1}} >{props.children}</main>;
}

function ResponsiveAppBar(props){
  if (props.isDesktop){
    return <StyledAppBar open={props.open} position="fixed" color="appBar" enableColorOnDark>{props.children}</StyledAppBar>;
  }
  return <AppBar position="fixed" color="appBar" enableColorOnDark>{props.children}</AppBar>;
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
    },
  });

  const isDesktop = useMediaQuery(theme.breakpoints.up('md'), {noSsr: true});
  const [open, setOpen] = useState(isDesktop);
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);
  const handleListClick = () => !isDesktop && setOpen(false);
 
  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = (e) => setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);
  const handleProfileMenuLogout = () => {
    navigate('/');
    app.logOut();
    setProfileMenuAnchorEl(null);
  };

  return (
    <ThemeProvider theme={theme}><Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <ResponsiveAppBar open={open} isDesktop={isDesktop} >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: 2, ...(open && { display: 'none' }) }}><MenuIcon /></IconButton>
          <Avatar src="/appicon.png" sx={{ width: 32, height: 32 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, marginLeft: 1 }}>
            KittenLocks
          </Typography>
          {app.currentUser
            ? <CardHeader sx={{ padding: 0 }}
                avatar={<Avatar src={app.currentUser.customData.avatarUrl} />}
                action={
                  <Fragment>
                    <IconButton aria-label="settings" onClick={handleProfileMenuOpen}><MoreVertIcon /></IconButton>
                    <Menu anchorEl={profileMenuAnchorEl} open={Boolean(profileMenuAnchorEl)} onClose={handleProfileMenuClose} >
                      <MenuItem onClick={handleProfileMenuLogout}>Log out</MenuItem>
                    </Menu>
                  </Fragment>
                }
                title={app.currentUser.customData.username}
                subheader={<ScopeBadges scopes={app.currentUser.customData.scopes} />}
              />
            : <LoginButton scopes={['profile']}/>
          }
        </Toolbar>
      </ResponsiveAppBar>
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
      <ResponsiveMain open={open} isDesktop={isDesktop} >
        <DrawerHeader />
        <Routes>
          <Route path="lock" element={
            <Paper elevation={6} sx={{ padding: 2, backgroundColor: '#1b192a' }} >
              <RequireLoggedInScope scopes={["profile", "locks"]}>
                <Suspense fallback={<p>loading...</p>} >
                  <MyLock/>
                </Suspense>
              </RequireLoggedInScope>
            </Paper>
          } />
          <Route path="locks" element={
            <Suspense fallback={<p>loading...</p>} >
              <Paper elevation={6} sx={{ padding: 2, backgroundColor: '#1b192a' }} ><PublicLocks/></Paper>
            </Suspense>
          } >
            <Route path=":username" element={ <Suspense fallback={<p>loading...</p>}><PublicLock/></Suspense> } />
          </Route>
          <Route path="trans" element={
            <Paper elevation={6} sx={{ padding: 2, backgroundColor: '#1b192a' }} >
              <RequireLoggedInScope scopes={["profile", "locks"]}>
                <Suspense fallback={<p>loading...</p>} >
                  <LockTransfer/>
                </Suspense>
              </RequireLoggedInScope>
            </Paper>
          } />
          <Route path="discord" element={
            <Paper elevation={6} sx={{ position: 'absolute', backgroundColor: '#1b192a', top: isDesktop ? 80 : 64, left: isDesktop ? ( open ? 256 : 16 ) : 0, right: isDesktop ? 16 : 0, bottom: isDesktop ? 16 : 0, padding: 2 }} >
              <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777377968869465" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"></iframe>
            </Paper>
          } />
          <Route path="*" element={
            <Paper elevation={6} sx={{ padding: 2, backgroundColor: '#1b192a' }} >
              <h2>Welcome to KittenLocks!</h2>
              <p>You will find exactly no introduction here for the moment! 😸</p>
              <Avatar src="/appicon.png" sx={{ width: 192, height: 192, marginLeft: 15 }} />
              <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>illustration PNG Designed By 588ku from <Link href="https://pngtree.com" target="_blank" rel="noreferrer">Pngtree.com</Link></Typography>
            </Paper>
          } />
        </Routes>
      </ResponsiveMain>
    </Box></ThemeProvider>
  );
}