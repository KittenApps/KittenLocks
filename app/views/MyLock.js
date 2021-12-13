import { useEffect, useState } from 'react';
import { Alert, FormControlLabel, Paper, Skeleton, Switch, Typography } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerficationPictureGalery from '../components/VerficationGalery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import LockHistory from '../components/LockHistory';
import { useQuery } from '@apollo/client';
import GetMyLocks from '../graphql/GetMyLocksQuery.graphql';
import { useSnackbar } from 'notistack';

export default function MyLock({ setSubNav }){
  const app = useRealmApp();
  const [showArchived, setShowArchived] = useState(false);
  const handleShowArchived = e => setShowArchived(e.target.checked);

  const { enqueueSnackbar } = useSnackbar();
  const { data, loading, error } = useQuery(GetMyLocks, { variables: { status: showArchived ? 'all' : 'active' } });
  useEffect(() => {
    if (error) enqueueSnackbar(error.toString(), { variant: 'error' });
  }, [error, enqueueSnackbar]);
  useEffect(() => {
    if (data) setSubNav({ public: null, locks: data.locks.map(j => ({ id: j._id, title: j.title, hist: true, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [data, setSubNav]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="p">
        {app.currentUser.customData.username}'s Locks:
        <FormControlLabel checked={showArchived} onClick={handleShowArchived} control={<Switch color="primary" />} label="show archived locks" labelPlacement="start" sx={{ float: 'right', mr: 2 }}/>
      </Typography>
      { data?.locks.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { loading || error ? <Skeleton variant="rectangular" width="100%" height={300} /> : data.locks.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (info):</Typography>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          <ScrollElement name={`hist-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (history):</Typography>
            <LockHistory app={app} id={j._id} startTime={j.hideTimeLogs ? 0 : Date.parse(j.minDate)} startRem={Date.parse(j.minDate) - Date.parse(j.startDate)}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.title} (verification pics):</Typography>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>))}
    </Paper>
  );
}