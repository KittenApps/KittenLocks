import { memo, useContext, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, Skeleton, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import { useQuery } from '@apollo/client';
import GetPublicLocks from '../graphql/GetPublicLocksQuery.graphql';
import GetPublicProfile from '../graphql/GetPublicProfileQuery.graphql';
import { useSnackbar } from 'notistack';
import { SubNavContext } from '../SubNavContext';

const PLock = memo(({ lock }) => (
  <ScrollElement name={lock._id}>
    <Typography variant="h5" gutterBottom component="p">{lock.title} (info):</Typography>
    <JsonView src={lock} collapsed={1}/>
  </ScrollElement>
));
PLock.displayName = 'PLock';

const PLocks = memo(({ userId, enqueueSnackbar, setSubNav, username }) => {
  const { data, error } = useQuery(GetPublicLocks, { variables: { userId }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  useEffect(() => {
    if (data) setSubNav({ public: username, locks: data.locks.map(j => ({ id: j._id, title: j.title, hist: false })) });
    return () => setSubNav(null);
  }, [data, setSubNav, username]);

  if (!data) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  if (data?.locks.length === 0) return <Alert severity="warning">It looks like <b>{username}</b> doesn't have any public locks yet :(</Alert>;
  return data.locks.map(l => <PLock key={l._id} lock={l}/>);
});
PLocks.displayName = 'PLocks';

function PublicLocks(){
  const { username } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { setSubNav } = useContext(SubNavContext);

  const { data, error } = useQuery(GetPublicProfile, { variables: { username }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error) enqueueSnackbar(error.toString(), { variant: 'error' });
  }, [error, enqueueSnackbar]);

  const notFound = useMemo(() => data?.profile === null, [data]);

  if (notFound) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error: User not found!</AlertTitle>
      A Chaster user with the username <b>{username}</b> doesn't exist.
    </Alert>
  );

  return (
    <>
      <ScrollElement name="profile" style={{ paddingBottom: 8 }}>
        <Typography variant="h4" gutterBottom component="p">Public profile of {data?.profile?.user.username || username}</Typography>
        { data ? <JsonView src={data.profile} collapsed={2}/> : <Skeleton variant="rectangular" width="100%" height={300}/> }
      </ScrollElement>
      <Typography variant="h4" gutterBottom component="p">Public locks of {data?.profile?.user.username || username}</Typography>
      { data ? <PLocks userId={data.profile.user._id} enqueueSnackbar={enqueueSnackbar} setSubNav={setSubNav} username={data.profile.user.username || username}/>
             : <Skeleton variant="rectangular" width="100%" height={300}/> }
    </>
  );
}

export const Component = memo(PublicLocks);