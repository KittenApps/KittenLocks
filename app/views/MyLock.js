import { Fragment, useEffect, useState } from 'react';
import { Alert, LinearProgress, Paper, Skeleton } from '@mui/material';
import ReactJson from 'react-json-view';
import { useRealmApp } from '../RealmApp';
import VerficationPictureGalery from '../components/VerficationPictureGalery';

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
      { loading && <LinearProgress/>}
      { historyJSON ? <ReactJson style={{ fontSize: 13 }} src={historyJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} name={false} theme="harmonic"/>
              : <Skeleton variant="rectangular" width="100%" height={300} /> }
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
          <ReactJson style={{ fontSize: 13 }} src={j} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} name={false} theme="harmonic"/>
          <h3>{j.title} (history):</h3>
          <LockHistory app={app} id={j._id}/>
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