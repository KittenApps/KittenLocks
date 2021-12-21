import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FormControlLabel, Paper, Skeleton, Switch, Typography } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerificationPictureGallery from '../components/VerificationGallery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import LockHistory from '../components/LockHistory';
import { useQuery } from '@apollo/client';
import GetMyLocks from '../graphql/GetMyLocksQuery.graphql';
import { useSnackbar } from 'notistack';

function lockSort(a, b){
  if (a.status !== b.status) return a.status > b.status ? 1 : -1;
  return a.startDate < b.startDate ? 1 : -1;
}

function MyLock({ setSubNav }){
  const app = useRealmApp();
  const [showArchived, setShowArchived] = useState(false);
  const handleShowArchived = useCallback(e => setShowArchived(e.target.checked), []);

  const { enqueueSnackbar } = useSnackbar();
  const { data, loading, error } = useQuery(GetMyLocks, { variables: { status: showArchived ? 'all' : 'active', realmId: app.currentUser.id } });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  const locks = useMemo(() => data && [...data.locks].sort(lockSort), [data]);
  useEffect(() => {
    if (locks && locks.length > 0) setSubNav({ public: null, locks: locks.map(j => ({ id: j._id, title: j.title, hist: true, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [locks, setSubNav]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="p">
        {app.currentUser.customData.username}'s Locks:
        <FormControlLabel checked={showArchived} onClick={handleShowArchived} control={<Switch color="primary" />} label="show archived locks" labelPlacement="start" sx={{ float: 'right' }}/>
      </Typography>
      { locks?.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { loading || error ? <Skeleton variant="rectangular" width="100%" height={300} /> : locks.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (info):</Typography>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          <ScrollElement name={`hist-${j._id}`} style={{ paddingBottom: 8 }}>
            <LockHistory title={`${j.title} (history):`} lockId={j._id} startTime={j.hideTimeLogs ? 0 : j.minDate.getTime()} startRem={j.minDate.getTime() - j.startDate.getTime()}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.title} (verification pics):</Typography>
              <VerificationPictureGallery history={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>))}
    </Paper>
  );
}

export default memo(MyLock);