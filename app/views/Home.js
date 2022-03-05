import { memo } from 'react';
import { Avatar, Grid, Link, Paper, Typography } from '@mui/material';
import AppIcon from '../../assets/appicon.webp';

function Home(){
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <Paper elevation={6} sx={{ textAlign: 'center', p: 2, backgroundColor: '#1b192a' }}>
          <h2>Welcome to KittenLocks!</h2>
          <p>A pawtastic WebApp to enchance your Chaster experience, <Link href="https://github.com/KittenApps/KittenLocks" target="_blank" rel="noreferrer">built with</Link> ❤ <Link href="https://chaster.app/user/Silizia" target="_blank" rel="noopener">by Silizia ~ Stella</Link>.</p>
          <Avatar src={AppIcon} sx={{ width: 300, height: 300, m: 'auto' }} />
          <Typography variant="caption" color="text.secondary">illustration PNG Designed By 588ku from <Link href="https://pngtree.com" target="_blank" rel="noreferrer">Pngtree.com</Link></Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
          <h3>Changelog v0.2 (WIP):</h3>
          <ul>
            <li key="1">KittenLocks.de is now a PWA and will be updated with bigger version updates from now on</li>
            <li key="2">use <Link href="https://beta.kittenlocks.de" target="_blank" rel="noreferrer">beta.KittenLocks.de</Link> to follow the latest development version (no PWA mode)</li>
            <li key="3">My Wearers Locks</li>
            <li key="4">Chaster Event page currently featuring Chastity Month</li>
            <li key="5">improved Verification Picture Gallery</li>
            <li key="6">many bug fixes and optimizations (I'm very precise here 😹)</li>
            <li key="7">[WIP] Lock Charts (visualize your unlock date over time)</li>
            <li key="8">[WIP] new Lock History (search and filter through your locks history)</li>
          </ul>
          <h3>Changelog v0.1:</h3>
          <ul>
            <li key="1">stabilized backend API</li>
            <li key="2">improved login / scopes management</li>
            <li key="3">new Chaster like theme</li>
            <li key="4">lock transfer</li>
            <li key="5">removed Locktober stats</li>
            <li key="6">lots of optimisations and bug fixes</li>
          </ul>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
          <h3>Roadmap:</h3>
          <ul>
            <li key="1">improved GUI for lock details (instead of pure JSON)</li>
            <li key="2">Voting Game (vote for other lockees with this game)</li>
            <li key="3">Multiplayer Extensions (once the API is released)</li>
            <li key="4">Shortcuts-like Extensions (once the API is released)</li>
          </ul>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default memo(Home);