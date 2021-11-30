import { Suspense, lazy, useEffect, useState } from 'react';
import { Alert, FormControlLabel, LinearProgress, Paper, Skeleton, Switch, Typography } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerficationPictureGalery from '../components/VerficationPictureGalery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';

const LockChart = lazy(() => import(/* webpackChunkName: "lock_chart" */ '../components/LockChart'));

function LockHistory({ app, id, startTime }){
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
      { historyJSON && startTime && !loading && <Suspense fallback={<p>loading...</p>}><LockChart history={historyJSON} startTime={startTime}/></Suspense> }
    </>
  );
}

export default function MyLock({ setSubNav }){
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

  useEffect(() => {
    if (locksJSON) setSubNav({ public: null, locks: locksJSON.map(j => ({ id: j._id, title: j.title, hist: true, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [locksJSON, setSubNav]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="p">
        {app.currentUser.customData.username}'s Locks:
        <FormControlLabel checked={showArchived} onClick={handleShowArchived} control={<Switch color="primary" />} label="show archived locks" labelPlacement="start" sx={{ float: 'right', mr: 2 }}/>
      </Typography>
      { locksJSON?.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { locksJSON ? locksJSON.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (info):</Typography>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          <ScrollElement name={`hist-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (history):</Typography>
            <LockHistory app={app} id={j._id} startTime={j.hideTimeLogs ? 0 : Date.parse(j.minDate)}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.title} (verification pics):</Typography>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>)) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </Paper>
  );
}