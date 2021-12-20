import { memo, useEffect, useState } from 'react';
import { Alert, Avatar, CardHeader, FormControl, InputLabel, Link, MenuItem, Paper, Select, Skeleton, Stack, Typography } from '@mui/material';
import VerificationPictureGallery from '../components/VerificationGallery';
import JsonView from '../components/JsonView';
import { useRealmApp } from '../RealmApp';
import { Element as ScrollElement } from 'react-scroll';
import { useNavigate } from 'react-router-dom';
import LockHistory from '../components/LockHistory';
import { useQuery } from '@apollo/client';
import GetMyWearers from '../graphql/GetMyWearersQuery.graphql';
import { useSnackbar } from 'notistack';

function MyWearers({ setSubNav }){
  const app = useRealmApp();
  const navigate = useNavigate();
  const [status, setStatus] = useState('locked');
  const handleStatusChange = e => setStatus(e.target.value);
  const { enqueueSnackbar } = useSnackbar();
  const { data, loading, error } = useQuery(GetMyWearers, { variables: { status, realmId: app.currentUser.id, pathBuilder: ({ args }) => `/keyholder/wearers?status=${args.status}` } });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  useEffect(() => {
    if (data && data.locks.length > 0) setSubNav({ public: null, locks: data.locks.map(j => ({ id: j._id, title: j.user.username, subtitle: j.title, hist: true, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [data, setSubNav]);

  const handleUsernameClick = username => () => navigate(`/locks/${username}`);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="div">
        My Wearer's Locks:
        <FormControl sx={{ float: 'right' }}>
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select labelId="filter-label" label="Filter" value={status} onChange={handleStatusChange}>
            <MenuItem value="locked">locked</MenuItem>
            <MenuItem value="unlocked">unlocked</MenuItem>
            <MenuItem value="deserted">deserted</MenuItem>
            <MenuItem value="archived">archived</MenuItem>
          </Select>
        </FormControl>
      </Typography>
      { data?.locks.length === 0 && <Alert severity="warning">Looks like you don't have any wearers yet :(</Alert> }
      { loading || error ? <Skeleton variant="rectangular" width="100%" height={300} /> : data.locks.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Stack direction="row" alignItems="center">
              <CardHeader
                sx={{ cursor: 'pointer' }}
                avatar={<Avatar src={j.user.avatarUrl}/>}
                onClick={handleUsernameClick(j.user.username)}
                title={j.user.username}
                titleTypographyProps={{ fontSize: 16 }}
                subheader={<Link>Public Lock Profile</Link>}
                subheaderTypographyProps={{ fontSize: 10 }}
              />
              <Typography variant="h5" gutterBottom component="div">
                {j.title} (info):
              </Typography>
            </Stack>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          <ScrollElement name={`hist-${j._id}`} style={{ paddingBottom: 8 }}>
            <LockHistory title={`${j.user.username}: ${j.title} (history):`} lockId={j._id} startTime={j.hideTimeLogs ? 0 : j.minDate.getTime()} startRem={j.minDate.getTime() - j.startDate.getTime()}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.user.username}: {j.title} (verification pics):</Typography>
              <VerificationPictureGallery history={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>))}
    </Paper>
  );
}

export default memo(MyWearers);