import * as React from "react";
import { useState } from "react";
import { useRealmApp } from "./RealmApp";
import { AppBar, Toolbar, Typography, IconButton, CardHeader, Avatar, Menu, MenuItem, Tabs, Tab, Stack, Paper } from '@material-ui/core';
import { Switch, Route, Link, useRouteMatch } from "react-router-dom";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import RequireLoggedInScope, { LoginScreen } from './RealmLogin';
const MyLock = React.lazy(() =>
  import(/* webpackChunkName: "myLock" */ "./components/MyLock")
);
const PublicLocks = React.lazy(() =>
  import(/* webpackChunkName: "publicLocks" */ "./components/PublicLocks")
);

function ScopeBadges(props){
  const p = props.scopes.includes('profile') ? 'blue' : 'grey';
  const l = props.scopes.includes('locks') ? 'hotpink' : 'grey';
  const k = props.scopes.includes('keyholder') ? 'purple' : 'grey';
  const m = props.scopes.includes('messaging') ? 'green' : 'grey';
  return (
    <Stack direction="row" spacing={0.5}>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: p }} >P</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: l }} >L</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: k }} >K</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: m }} >M</Avatar>
    </Stack>
  )
}

export default function App(){
  const app = useRealmApp();

  const [profileMenuAnchorEl, setProfileMenuAnchorEl] = useState(null);
  const handleProfileMenuOpen = (e) => setProfileMenuAnchorEl(e.currentTarget);
  const handleProfileMenuClose = () => setProfileMenuAnchorEl(null);
  const handleProfileMenuLogout = () => {
    app.logOut();
    setProfileMenuAnchorEl(null);
  };

  const routeMatch = useRouteMatch(['/trans', '/locks', '/lock', '/discord', '/']);
  const currentTab = routeMatch?.path;

  return (
    <React.Fragment>
      <AppBar position="static">
        <Toolbar>
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
      </AppBar>
      <Tabs value={currentTab}>
        <Tab label="Home" value="/" to="/" component={Link} />
        <Tab label="My lock profile" value="/lock" to="/lock" component={Link} />
        <Tab label="Public lock profiles" value="/locks" to="/locks" component={Link} />
        <Tab label="Public lock charts" value="link" onClick= {() =>  window.open('https://charts.mongodb.com/charts-chasterstats-nenew/public/dashboards/60f9ce94-6b51-42a0-8d3d-3dcd2c00ae20', '_blank').focus()}/>
        <Tab label="Lock Transfer" value="/trans" to="/trans" component={Link} />
        <Tab label="Discord Community" value="/discord" to="/discord" component={Link} />
      </Tabs>
      <Paper elevation={6} sx={{ margin: 1, padding: 2, height: "calc(100% - 160px)", overflow: "auto" }} >
        <Switch>
          <Route path="/lock">
            <RequireLoggedInScope scopes={["profile", "locks"]}>
              <React.Suspense fallback={<p>loading...</p>} >
                <MyLock/>
              </React.Suspense>
            </RequireLoggedInScope>
          </Route>
          <Route path={["/locks/:name", "/locks"]}>
            <React.Suspense fallback={<p>loading...</p>} >
              <PublicLocks/>
            </React.Suspense>
          </Route>
          <Route path="/trans">
            <RequireLoggedInScope scopes={["profile", "locks"]}>
              <p>Welcome to Kitten Trans(fer)! 🏳️‍⚧️</p>
              <div>{JSON.stringify(app.currentUser?.customData, null, '  ')}</div> 
            </RequireLoggedInScope>
          </Route>
          <Route path="/discord">
            <div style={{ height: '100%' }} ><iframe src="https://e.widgetbot.io/channels/879777377541033984/879777377968869465" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"></iframe></div>
          </Route>
          <Route path="/">
            <h2>Welcome to KittenLocks!</h2>
            <p>You will find exactly no introduction here for the moment! 😸</p>
          </Route>
        </Switch>
      </Paper>
    </React.Fragment>
  );
}