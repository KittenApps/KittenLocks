import { memo } from 'react';
import { Avatar, Grid, Link, Paper } from '@mui/material';
import Kitten from '../../assets/kitten.webp';

function Support(){
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper elevation={6} sx={{ textAlign: 'center', p: 2, backgroundColor: '#1b192a' }}>
          <p>Hey, I'm Silizia (~Stella) a 30 year old trans woman and computer scientist.</p>
          <p>I'm developing KittenLocks as a hobby proect in my free time.</p>
          <Avatar src={Kitten} sx={{ width: 300, height: 300, m: 'auto' }} />
          <Link href="https://ko-fi.com/silizia" target="_blank" rel="noreferrer">Support KittenLocks on Ko-Fi...</Link>
          <p>It would be very helpful to cover the server costs and to sponsor the further development.</p>
          <p>Kittenlocks will offer you Chaster public API tools and future extensions (games...)</p>
          <p>Feel free to take a look at my other projects too:</p>
          <p><Link href="https://kittensafe.netlify.app" target="_blank" rel="noreferrer">KittenSafe</Link> (delayed file access with focus on privacy (no data stored on the backend))</p>
          <p><Link href="https://purrer.netlify.com/" target="_blank" rel="noreferrer">Purrer</Link> (send WebPush Notifications to other users)</p>
          <p>get a specia <b>Supporter</b> role on <Link href="https://discord.com/invite/cQhHH2sP3C" target="_blank" rel="noreferrer">our KittenLocks Discord server</Link> if you link your ko-fi</p>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
          <iframe id="kofiframe" src="https://ko-fi.com/silizia/?hidefeed=true&widget=true&embed=true&preview=true" style={{ border: 'none', width: '100%', padding: 4, background: '#f9f9f9' }} height="712" title="silizia"/>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default memo(Support);