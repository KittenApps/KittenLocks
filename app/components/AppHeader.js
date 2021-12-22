import { memo, useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { AppBar, Avatar, Backdrop, Button, ButtonGroup, CardHeader, Checkbox, CircularProgress, Divider, IconButton,
         Link, ListItemIcon, ListSubheader, Menu, MenuItem, Stack, Toolbar, Typography, useMediaQuery } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowDropDown, Bookmark, BookmarkBorder, DeleteForeverTwoTone, Login, Logout, ManageAccounts, Menu as MenuIcon, MoreVert, Settings } from '@mui/icons-material';
import { useRealmApp } from '../RealmApp';
import ScopeBadges from './ScopeBadges';
import AppIcon from '../../assets/appicon.png';
import { useSnackbar } from 'notistack';
import { register, unregister } from '../SwUtils';

const drawerWidth = 250;

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

const UpdateAction = memo(({ index, wsw, setWSW }) => {
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const updatePromptAction = useCallback(k => <UpdateAction index={k} wsw={wsw} setWSW={setWSW}/>, [setWSW, wsw]);
  const handleNotistackClose = useCallback(() => {
    closeSnackbar(index);
    setTimeout(() => enqueueSnackbar('A new KittenLocks update is available! Please upgrade to the latest version by reloading the page now.',
                                     { variant: 'warning', persist: true, action: updatePromptAction }), 5 * 60 * 1000);
  }, [closeSnackbar, enqueueSnackbar, index, updatePromptAction]);
  const handleSWPromp = useCallback(() => {
    wsw.addEventListener('statechange', e => {
      if (e.target.state === 'activated'){
        wsw.postMessage({ type: 'RELOAD_ALL_CLIENTS' }); // eslint-disable-line unicorn/require-post-message-target-origin
        window.location.reload();
      }
    });
    wsw.postMessage({ type: 'SKIP_WAITING' }); // eslint-disable-line unicorn/require-post-message-target-origin
    closeSnackbar(index);
    setWSW(42);
  }, [closeSnackbar, index, setWSW, wsw]);
  return (
    <Stack spacing={1} direction="row">
      <Button color="warning" variant="contained" onClick={handleSWPromp} size="small">Reload now</Button>
      <Button color="inherit" variant="outlined" onClick={handleNotistackClose} size="small">Remind me later</Button>
    </Stack>
  );
});
UpdateAction.displayName = 'UpdateAction';

function AppHeader({ isDesktop, setOpen, showLogin, open }){
  const app = useRealmApp();
  const { enqueueSnackbar } = useSnackbar();
  const isTinyScreen = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const handleDrawerOpen = useCallback(() => setOpen(true), [setOpen]);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = useCallback(e => setProfileMenuAnchorEl(e.currentTarget), []);
  const handleProfileMenuClose = useCallback(() => setProfileMenuAnchorEl(null), []);
  const handleProfileMenuLogout = useCallback(() => {
    navigate('/');
    app.logOut();
    setProfileMenuAnchorEl(null);
  }, [app, navigate]);

  const handleLogin = useCallback(() => showLogin(true), [showLogin]);
  const handleManage = useCallback(() => {handleLogin(); setProfileMenuAnchorEl(null);}, [handleLogin]);
  const handleResetCache = useCallback(() => {app.client.resetStore(); app.persistor.purge(); setProfileMenuAnchorEl(null);}, [app.client, app.persistor]);

  const [noOffline, setNoOffline] = useState(localStorage.getItem('noOffline') === 'true');
  const [waitingServiceWorker, setWaitingServiceWorker] = useState(null);
  const updatePromptAction = useCallback(index => <UpdateAction index={index} wsw={waitingServiceWorker} setWSW={setWaitingServiceWorker}/>, [waitingServiceWorker]);
  useEffect(() => {
    if (waitingServiceWorker && waitingServiceWorker !== 42){
      enqueueSnackbar('A new KittenLocks update is available! Please upgrade to the latest version by reloading now.', { variant: 'warning', persist: true, action: updatePromptAction });
    }
  }, [enqueueSnackbar, updatePromptAction, waitingServiceWorker]);

  useEffect(() => {
    const onMessage = event => event.data && event.data.type === 'CLIENT_RELOAD' && window.location.reload();
    if (noOffline || process.env.BRANCH === 'beta' || process.env.NODE_ENV !== 'production'){
      unregister();
      navigator.serviceWorker.removeEventListener('message', onMessage);
    } else register({
      onUpdate: reg => setWaitingServiceWorker(reg.waiting),
      onSuccess: () => enqueueSnackbar('ServiceWorker successfully registered! KittenLocks is now available offline for you too.', { variant: 'success' })
    }).then(() => navigator.serviceWorker.addEventListener('message', onMessage));
  }, [enqueueSnackbar, noOffline]);

  const handleToggleOffline = useCallback(() => {
    localStorage.setItem('noOffline', !noOffline);
    if (noOffline) window.location.reload();
    setNoOffline(!noOffline);
    setProfileMenuAnchorEl(null);
  }, [noOffline]);

  return (
    <>
      { waitingServiceWorker === 42 && <Backdrop sx={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: t => t.zIndex.drawer + 1 }} open><CircularProgress color="inherit"/></Backdrop> }
      <Backdrop open={Boolean(profileMenuAnchorEl)} sx={{ zIndex: t => t.zIndex.drawer + 1, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}/>
      <StyledAppBar open={open} isDesktop={isDesktop} >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: { xs: 0, sm: 2 }, ...(open && { display: 'none' }) }}><MenuIcon/></IconButton>
          <Avatar src={AppIcon} sx={{ width: 32, height: 32, display: { xs: 'none', sm: 'block' } }}/>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1 }}>
            KittenLocks
          </Typography>
          { app.currentUser
            ? <CardHeader
                sx={{ p: 0, cursor: 'pointer', '& .MuiCardHeader-action': { mt: 0 } }}
                avatar={<Avatar src={app.currentUser.customData.avatarUrl}/>}
                onClick={handleProfileMenuOpen}
                action={<IconButton aria-label="settings" onClick={handleProfileMenuOpen}><MoreVert/></IconButton>}
                title={app.currentUser.customData.username}
                titleTypographyProps={{ fontSize: 16 }}
                subheader={<ScopeBadges scopes={app.currentUser.customData.scopes}/>}
              />
            : (
              <ButtonGroup variant="contained" size="small">
                <Button onClick={handleLogin} size="small" sx={{ px: 2 }}>{isTinyScreen ? 'Login' : 'Login with Chaster ...'}</Button>
                <Button onClick={handleProfileMenuOpen} size="small"><Settings/><ArrowDropDown/></Button>
              </ButtonGroup>
            )}
          <Menu
            anchorEl={profileMenuAnchorEl}
            open={Boolean(profileMenuAnchorEl)}
            onClose={handleProfileMenuClose}
            sx={{ mt: 1 }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            { app.currentUser ? <MenuItem onClick={handleManage}><ListItemIcon><ManageAccounts/></ListItemIcon>Manage scopes</MenuItem>
                              : <MenuItem onClick={handleLogin}><ListItemIcon><Login/></ListItemIcon>Login with Chaster ...</MenuItem> }
            { app.currentUser && <MenuItem component={Link} href="https://chaster.app/settings/profile" target="_blank" rel="noopener"><ListItemIcon><Settings/></ListItemIcon>Chaster settings</MenuItem> }
            { app.currentUser && <Divider/> }
            { app.currentUser && <MenuItem onClick={handleProfileMenuLogout}><ListItemIcon><Logout/></ListItemIcon>Log out</MenuItem> }
            <Divider style={{ marginBottom: 0 }}/>
            <ListSubheader sx={{ textAlign: 'center', lineHeight: '32px' }}>Advanced Settings:</ListSubheader>
            { process.env.BRANCH !== 'beta' && process.env.NODE_ENV === 'production' && (
              <MenuItem dense onClick={handleToggleOffline}>
                <ListItemIcon><Checkbox sx={{ p: 0 }} checked={!noOffline} icon={<BookmarkBorder/>} checkedIcon={<Bookmark/>}/></ListItemIcon>
                {noOffline ? 'enable offline PWA' : 'remove PWA cache'}
              </MenuItem>
            )}
            <MenuItem dense onClick={handleResetCache}><ListItemIcon><DeleteForeverTwoTone/></ListItemIcon>Reset Cache</MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
    </>
  );
}

export default memo(AppHeader);