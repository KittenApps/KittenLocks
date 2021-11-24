import { Fragment, lazy, useEffect, useState } from 'react';
import { Alert, LinearProgress, Paper, Skeleton } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerficationPictureGalery from '../components/VerficationPictureGalery';
import JsonView from '../components/JsonView';
const LockChart = lazy(() => import(/* webpackChunkName: "lock_chart" */ '../components/LockChart'));

function LockHistory(props){
  const [historyJSON, setHistoryJSON] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    props.app.getAccessToken().then(({ accessToken }) => {
      const fetchHistory = async lastId => {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
        const ch = await fetch(`https://api.chaster.app/locks/${props.id}/history`, { headers, signal, method: 'POST', body: JSON.stringify({ lastId, limit: 100 }) }).then(d => d.json());
        setHistoryJSON(h => [...h, ...ch.results]);
        if (ch.hasMore) await fetchHistory(ch.results[99]._id);
      };
      return fetchHistory();
    }).then(() => setLoading(false));
    return () => controller.abort();
  }, [props.app, props.id]);

  return (
    <>
      { loading && <LinearProgress/> }
      { historyJSON ? <JsonView src={historyJSON} collapsed={1}/> : <Skeleton variant="rectangular" width="100%" height={300} /> }
      { loading && <LinearProgress/> }
      { historyJSON && props.timeLogs && !loading && <LockChart data={historyJSON}/> }
    </>
  );
}

export default function MyLock(){
  const app = useRealmApp();
  const [locksJSON, setLocksJSON] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    app.getAccessToken().then(({ accessToken }) => {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      return fetch('https://api.chaster.app/locks', { headers, signal });
    }).then(d => d.json()).then(j => setLocksJSON(j));
    return () => controller.abort();
  }, [app]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <h2>{app.currentUser.customData.username}'s Locks:</h2>
      { locksJSON?.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { locksJSON ? locksJSON.map(j => (
        <Fragment key={j._id}>
          <h3>{j.title} (info):</h3>
          <JsonView src={j} collapsed={1}/>
          <h3>{j.title} (history):</h3>
          <LockHistory app={app} id={j._id} timeLogs={!j.hideTimeLogs}/>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <>
              <h3>{j.title} (verification pics):</h3>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </>
          )}
        </Fragment>)) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </Paper>
  );
}