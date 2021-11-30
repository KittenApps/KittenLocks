import { useEffect, useState } from 'react';
import { Paper, Skeleton } from '@mui/material';
import LockChart from '../components/LockChart';

export default function PublicCharts(){
  const [history, setHistory] = useState(null);

  useEffect(() => fetch('https://silizia.netlify.app/Silizia.json').then(d => d.json()).then(d => setHistory(d)), []);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h1>Public Lock Chart Demo Silizia:</h1>
      { history ? <LockChart history={history} startTime={Date.parse('2021-07-12T22:52:58.000Z')}/> : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </Paper>
  );
}