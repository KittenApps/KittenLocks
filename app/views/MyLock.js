import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FormControlLabel, Paper, Skeleton, Stack, Switch, Typography } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import VerificationPictureGallery from '../components/VerificationGallery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import LockHistory from '../components/LockHistory';
import RequiredScopes from '../components/RequiredScopes';
import { useQuery } from '@apollo/client';
import GetMyLocks from '../graphql/GetMyLocksQuery.graphql';
import { useSnackbar } from 'notistack';

const MLock = memo(({ lock }) => (
  <ScrollElement name={lock._id}>
    <ScrollElement name={`info-${lock._id}`} style={{ paddingBottom: 8 }}>
      <Typography variant="h5" gutterBottom component="p">{lock.title} (info):</Typography>
      <JsonView src={lock} collapsed={1}/>
    </ScrollElement>
    <ScrollElement name={`hist-${lock._id}`} style={{ paddingBottom: 8 }}>
      <LockHistory
        title={`${lock.title} (history):`}
        lockId={lock._id}
        startTime={lock.hideTimeLogs ? 0 : lock.minDate.getTime()}
        startRem={lock.minDate.getTime() - lock.startDate.getTime()}
      />
    </ScrollElement>
    { lock.extensions.find(e => e.slug === 'verification-picture') && (
      <ScrollElement name={`veri-${lock._id}`} style={{ paddingBottom: 8 }}>
        <Typography variant="h5" gutterBottom component="p">{lock.title} (verification pics):</Typography>
        <VerificationPictureGallery history={lock.extensions.find(e => e.slug === 'verification-picture').userData.history}/>
      </ScrollElement>
    )}
  </ScrollElement>
));
MLock.displayName = 'MLock';

const lockSort = (a, b) => {
  if (a.status !== b.status) return a.status > b.status ? 1 : -1;
  return a.startDate < b.startDate ? 1 : -1;
};

const MyLock = memo(({ setSubNav }) => {
  const app = useRealmApp();
  const [showArchived, setShowArchived] = useState(false);
  const handleShowArchived = useCallback(e => setShowArchived(e.target.checked), []);

  const { enqueueSnackbar } = useSnackbar();
  const { data, error } = useQuery(GetMyLocks, { variables: { status: showArchived ? 'all' : 'active', realmId: app.currentUser.id }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
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
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" gutterBottom component="p" flexGrow={1}>{app.currentUser.customData.username}'s Locks:</Typography>
        <FormControlLabel checked={showArchived} onClick={handleShowArchived} control={<Switch color="primary" />} label="show archived locks" labelPlacement="start"/>
      </Stack>
      { locks?.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { data ? locks.map(l => <MLock key={l._id} lock={l}/>) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </Paper>
  );
});
MyLock.displayName = 'MyLock';

function PermissionWrapper({ setSubNav, onMissingScopes }){
  return (
    <RequiredScopes rScopes={['locks']} onMissingScopes={onMissingScopes} component="lock">
      <MyLock setSubNav={setSubNav}/>
    </RequiredScopes>
  );
}

export default memo(PermissionWrapper);