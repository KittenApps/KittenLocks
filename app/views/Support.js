import { memo } from 'react';
import { Avatar, Grid, Link, Paper } from '@mui/material';
import Kitten from '../../assets/kitten.webp';

function Support(){
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper elevation={6} sx={{ textAlign: 'center', p: 2, backgroundColor: '#1b192a' }}>
          <p>Silizia 30 year old trans woman and computer scientist</p>
          <p>developing KittenLocks as a hobby in my free time</p>
          <Avatar src={Kitten} sx={{ width: 300, height: 300, m: 'auto' }} />
          <Link href="https://ko-fi.com/silizia" target="_blank" rel="noreferrer">Support KittenLocks on Ko-Fi...</Link>
          <p>Home of public API views and future Chaster extensions (games...)</p>
          <p>support server costs + development effort</p>
          <p>other projects:</p>
          <p><Link href="https://kittensafe.netlify.app" target="_blank" rel="noreferrer">KittenSafe</Link> (delayed file access with focus on privacy (no data stored on the backend))</p>
          <p><Link href="https://purrer.netlify.com/" target="_blank" rel="noreferrer">Purrer</Link></p>
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