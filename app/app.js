import * as React from "react";
import { useState } from "react";
import { useRealmApp } from "./RealmApp";
import { styled, useTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, IconButton, CardHeader, Avatar, Menu, MenuItem, Box, useMediaQuery,
         Paper, Drawer, CssBaseline, List, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/HomeTwoTone';
import LockIcon from '@mui/icons-material/Lock';
import Lock2Icon from '@mui/icons-material/LockTwoTone';
import AddLockItem from '@mui/icons-material/EnhancedEncryptionTwoTone';
import ChartIcon from '@mui/icons-material/ShowChart';
import CompareIcon from '@mui/icons-material/CompareArrows';
import ChatIcon from '@mui/icons-material/ChatTwoTone';
import RequireLoggedInScope, { LoginScreen, ScopeBadges } from './RealmLogin';
const MyLock = React.lazy(() =>
  import(/* webpackChunkName: "my_lock" */ "./components/MyLock")
);
const PublicLocks = React.lazy(() =>
  import(/* webpackChunkName: "public_locks" */ "./components/PublicLocks")
);
const LockTransfer = React.lazy(() =>
  import(/* webpackChunkName: "lock_transfer" */ "./components/LockTransfer")
);

const Link = React.forwardRef(
  ({ ...props }, ref) => <NavLink ref={ref} {...props} className={({ isActive }) => [props.className, isActive ? 'Mui-selected' : null].filter(Boolean).join(' ')}/>
);

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(1),
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

export default function App(){
  const app = useRealmApp();
  const navigate = useNavigate();

  const theme = useTheme();
  const [open, setOpen] = React.useState(useMediaQuery(useTheme().breakpoints.up('md'), {noSsr: true}));
  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = (e) => setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);
  const handleProfileMenuLogout = () => {
    navigate('/');
    app.logOut();
    setProfileMenuAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar open={open} position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: 2, ...(open && { display: 'none' }) }}><MenuIcon /></IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            KittenLocks
          </Typography>
          {app.currentUser
            ? <CardHeader sx={{ padding: 0 }}
                avatar={<Avatar src={app.currentUser.customData.avatarUrl} />}
                action={
                  <React.Fragment>
                    <IconButton aria-label="settings" onClick={handleProfileMenuOpen}><MoreVertIcon /></IconButton>
                    <Menu anchorEl={profileMenuAnchorEl} open={Boolean(profileMenuAnchorEl)} onClose={handleProfileMenuClose} >
                      <MenuItem onClick={handleProfileMenuLogout}>Log out</MenuItem>
                    </Menu>
                  </React.Fragment>
                }
                title={app.currentUser.customData.username}
                subheader={<ScopeBadges scopes={app.currentUser.customData.scopes} />}
              />
            : <LoginScreen scopes={['profile']}/>
          }
        </Toolbar>
      </StyledAppBar>
      <Drawer variant="persistent" anchor="left" open={open} sx={{width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': {width: drawerWidth, boxSizing: 'border-box'}}}>
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItemButton key={0} component={Link} to="/">         <ListItemIcon><HomeIcon/></ListItemIcon>   <ListItemText primary="Home"/></ListItemButton>
          <Divider key={-1}/>
          <ListItemButton key={1} component={Link} to="/lock">     <ListItemIcon><LockIcon/></ListItemIcon>   <ListItemText primary="My lock profile"/></ListItemButton>
          <ListItemButton key={2} component={Link} to="/locks">    <ListItemIcon><Lock2Icon/></ListItemIcon>  <ListItemText primary="Public lock profiles"/></ListItemButton>
          <Divider key={-2}/>
          <ListItemButton disabled key={3} component={Link} to="/"><ListItemIcon><ChartIcon/></ListItemIcon>  <ListItemText primary="Public lock charts"/></ListItemButton>
          <ListItemButton disabled key={4} component={Link} to="/"><ListItemIcon><AddLockItem/></ListItemIcon><ListItemText primary="Voting Game"/></ListItemButton>
          <ListItemButton key={5} component={Link} to="/trans">    <ListItemIcon><CompareIcon/></ListItemIcon><ListItemText primary="Lock Transfer"/></ListItemButton>
          <Divider key={-3}/>
          <ListItemButton key={6} component={Link} to="/discord">  <ListItemIcon><ChatIcon/></ListItemIcon>   <ListItemText primary="Discord Community"/></ListItemButton>
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Routes>
          <Route path="lock" element={
            <RequireLoggedInScope scopes={["profile", "locks"]}>
              <React.Suspense fallback={<p>loading...</p>} >
                <Paper elevation={6} sx={{ margin: 1, padding: 2 }} ><MyLock/></Paper>
              </React.Suspense>
            </RequireLoggedInScope>
          } />
          <Route path="locks" element={
            <React.Suspense fallback={<p>loading...</p>} >
              <Paper elevation={6} sx={{ margin: 1, padding: 2 }} ><PublicLocks/></Paper>
            </React.Suspense>
          } >
            <Route path=":name" element={
              <React.Suspense fallback={<p>loading...</p>} >
                <Paper elevation={6} sx={{ margin: 1, padding: 2 }} ><PublicLocks/></Paper>
              </React.Suspense>
            } />
          </Route>
          <Route path="trans" element={
            <RequireLoggedInScope scopes={["profile", "locks"]}>
              <React.Suspense fallback={<p>loading...</p>} >
                <Paper elevation={6} sx={{ margin: 1, padding: 2 }} ><LockTransfer/></Paper>
              </React.Suspense>
            </RequireLoggedInScope>
          } >
            <Route path=":lock" element={
            <RequireLoggedInScope scopes={["profile", "locks"]}>
              <React.Suspense fallback={<p>loading...</p>} >
                <Paper elevation={6} sx={{ margin: 1, padding: 2 }} ><LockTransfer/></Paper>
              </React.Suspense>
            </RequireLoggedInScope>
          } />
          </Route>
          <Route path="discord" element={
            <Paper elevation={6} sx={{ position: 'absolute', top: 80, left: open ? 256 : 16, right: 16, bottom: 16, padding: 2 }} >
              <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777377968869465" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"></iframe>
            </Paper>
          } />
          <Route path="*" element={
            <Paper elevation={6} sx={{ margin: 1, padding: 2 }} >
              <h2>Welcome to KittenLocks!</h2>
              <p>You will find exactly no introduction here for the moment! 😸</p>
            </Paper>
          } />
        </Routes>
      </Main>
    </Box>
  );
}