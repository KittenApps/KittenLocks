import { memo, useState } from 'react';
import { styled } from '@mui/material/styles';
import { AppBar, Avatar, Backdrop, Button, CardHeader, Divider, IconButton, Link, ListItemIcon, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Clear, Logout, ManageAccounts, Menu as MenuIcon, MoreVert, Settings } from '@mui/icons-material';
import ScopeBadges from './ScopeBadges';

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

function AppHeader({ isDesktop, app, setOpen, showLogin }){
  const navigate = useNavigate();
  const handleDrawerOpen = () => setOpen(true);

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = e => setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);
  const handleProfileMenuLogout = () => {
    navigate('/');
    app.logOut();
    setProfileMenuAnchorEl(null);
  };

  const handleLogin = () => showLogin(true);
  const handleManage = () => {handleLogin(); setProfileMenuAnchorEl(null);};
  const handleResetCache = () => {app.client.resetStore(); setProfileMenuAnchorEl(null);};
  return (
    <>
      <Backdrop open={Boolean(profileMenuAnchorEl)} sx={{ zIndex: t => t.zIndex.drawer + 1, backgroundColor: 'rgba(0, 0, 0, 0.75)' }}/>
      <StyledAppBar open={open} isDesktop={isDesktop} >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleDrawerOpen} sx={{ mr: { xs: 0, sm: 2 }, ...(open && { display: 'none' }) }}><MenuIcon/></IconButton>
          <Avatar src="/appicon.png" sx={{ width: 32, height: 32, display: { xs: 'none', sm: 'block' } }}/>
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
            : <Button variant="contained" onClick={handleLogin} size="small">Login with Chaster</Button>}
          <Menu
            anchorEl={profileMenuAnchorEl}
            open={Boolean(profileMenuAnchorEl)}
            onClose={handleProfileMenuClose}
            sx={{ mt: 1 }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleManage}><ListItemIcon><ManageAccounts/></ListItemIcon>Manage scopes</MenuItem>
            <MenuItem component={Link} href="https://chaster.app/settings/profile" target="_blank" rel="noopener"><ListItemIcon><Settings/></ListItemIcon>Chaster settings</MenuItem>
            <MenuItem onClick={handleResetCache}><ListItemIcon><Clear/></ListItemIcon>Reset Cache</MenuItem>
            <Divider/>
            <MenuItem onClick={handleProfileMenuLogout}><ListItemIcon><Logout/></ListItemIcon>Log out</MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
    </>
  );
}

export default memo(AppHeader);