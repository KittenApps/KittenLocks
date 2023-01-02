import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { Alert, Button, Paper, Skeleton, Typography } from '@mui/material';
import { UploadFileTwoTone } from '@mui/icons-material';
const Chart = lazy(() => import(/* webpackChunkName: "lock_chart" */ '../components/Chart'));

function PublicCharts(){
  const [options, setOptions] = useState(null);
  const handleOpen = useCallback(e => e.target.files[0].text().then(j => setOptions(JSON.parse(j))), []);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="div">View shared Lock Charts:</Typography>
      <Alert severity="info">You can export your own Lock Chart by going to a chart (requires time information in history) in 'My Lock Profile' or 'My Wearers Locks' and selecting the 'Share as interactive Lock Chart'-option in the top right export hamburger menu.</Alert>
      <label htmlFor="openLockChart">
        <input id="openLockChart" type="file" onChange={handleOpen} accept=".klc" hidden/>
        <Button variant="contained" startIcon={<UploadFileTwoTone/>} component="span" fullWidth>Open shared Lock Chart file (.klc) ...</Button>
      </label>
      <p>
        { options && <Suspense fallback={<Skeleton variant="rectangular" width="100%" height={300}/>}><Chart {...options}/></Suspense> }
      </p>
    </Paper>
  );
}

export default memo(PublicCharts);