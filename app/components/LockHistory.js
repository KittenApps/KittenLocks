import { useEffect, useState } from 'react';
import { LinearProgress, Skeleton } from '@mui/material';
import JsonView from '../components/JsonView';
import LockChart from '../components/LockChart';

export default function LockHistory({ app, id, startTime, startRem }){
  const [historyJSON, setHistoryJSON] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    app.getAccessToken().then(({ accessToken }) => {
      const fetchHistory = async lastId => {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
        const ch = await fetch(`https://api.chaster.app/locks/${id}/history`, { headers, signal, method: 'POST', body: JSON.stringify({ lastId, limit: 100 }) }).then(d => d.json());
        setHistoryJSON(h => [...h, ...ch.results]);
        if (ch.hasMore) await fetchHistory(ch.results[99]._id);
      };
      return fetchHistory();
    }).then(() => setLoading(false));
    return () => controller.abort();
  }, [app, id]);

  return (
    <>
      { loading && <LinearProgress/> }
      { historyJSON ? <JsonView src={historyJSON} collapsed={0}/> : <Skeleton variant="rectangular" width="100%" height={300} /> }
      { loading && <LinearProgress/> }
      { historyJSON && startTime !== 0 && !loading && <LockChart history={historyJSON} startTime={startTime} startRem={startRem}/> }
    </>
  );
}