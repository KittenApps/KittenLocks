import { Fragment, Suspense, lazy, useEffect, useState } from 'react';
import { Alert, FormControlLabel, LinearProgress, Paper, Skeleton, Switch } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerficationPictureGalery from '../components/VerficationPictureGalery';
import JsonView from '../components/JsonView';
const LockChart = lazy(() => import(/* webpackChunkName: "lock_chart" */ '../components/LockChart'));

function LockHistory({ app, id, timeLogs }){
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
      { historyJSON && timeLogs && !loading && <Suspense fallback={<p>loading...</p>}><LockChart history={historyJSON}/></Suspense> }
    </>
  );
}

export default function MyLock(){
  const app = useRealmApp();
  const [showArchived, setShowArchived] = useState(false);
  const [locksJSON, setLocksJSON] = useState(null);

  const handleShowArchived = e => setShowArchived(e.target.checked);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    app.getAccessToken().then(({ accessToken }) => {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      return fetch(`https://api.chaster.app/locks${showArchived ? '?status=all' : ''}`, { headers, signal });
    }).then(d => d.json()).then(j => setLocksJSON(j.sort((a, b) => {
      if (a.status !== b.status) return a.status > b.status ? 1 : -1;
      return a.startDate < b.startDate ? 1 : -1;
    })));
    return () => controller.abort();
  }, [app, showArchived]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <h2>
        {app.currentUser.customData.username}'s Locks:
        <FormControlLabel checked={showArchived} onClick={handleShowArchived} control={<Switch color="primary" />} label="show archived locks" labelPlacement="start" sx={{ float: 'right', mr: 2 }}/>
      </h2>
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