import { Suspense, lazy, memo, useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, Paper, Skeleton, Typography } from '@mui/material';
import { ExpandMore, UploadFileTwoTone } from '@mui/icons-material';
import LockChart from '../components/LockChart';
import { useQuery } from '@apollo/client';
import GetSiliziaDemo from '../graphql/GetSiliziaDemoQuery.graphql';
import { useSnackbar } from 'notistack';
const Chart = lazy(() => import(/* webpackChunkName: "lock_chart" */ '../components/Chart'));

const SampleChart = memo(() => {
  const { enqueueSnackbar } = useSnackbar();
  const { data, error } = useQuery(GetSiliziaDemo, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  if (!data) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  return <LockChart history={data.siliziaHistory} startTime={Date.parse('2021-07-12T22:52:58.000Z')} startRem={86400000}/>;
});
SampleChart.displayName = 'SampleChart';

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
      <Accordion TransitionProps={{ mountOnEnter: true }}>
        <AccordionSummary expandIcon={<ExpandMore/>}><b>Load example Lock Chart from Silizia</b></AccordionSummary>
        <AccordionDetails><SampleChart/></AccordionDetails>
      </Accordion>
    </Paper>
  );
}

export default memo(PublicCharts);