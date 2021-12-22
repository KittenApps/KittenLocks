import { memo, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, Skeleton, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import VerificationPictureGallery from '../components/VerificationGallery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import { useQuery } from '@apollo/client';
import { GetPublicLocks, GetPublicProfile } from '../graphql/GetPublicLocksQuery.graphql';
import { useSnackbar } from 'notistack';

const PLock = memo(({ lock }) => (
  <ScrollElement name={lock._id}>
    <ScrollElement name={`info-${lock._id}`} style={{ paddingBottom: 8 }}>
      <Typography variant="h5" gutterBottom component="p">{lock.title} (info):</Typography>
      <JsonView src={lock} collapsed={1}/>
    </ScrollElement>
    { lock.extensions.find(e => e.slug === 'verification-picture') && (
      <ScrollElement name={`veri-${lock._id}`} style={{ paddingBottom: 8 }}>
        <Typography variant="h5" gutterBottom component="p">{lock.title} (verification pics):</Typography>
        <VerificationPictureGallery history={lock.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
      </ScrollElement>
    )}
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
    if (data) setSubNav({ public: username, locks: data.locks.map(j => ({ id: j._id, title: j.title, hist: false, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [data, setSubNav, username]);

  if (!data) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  if (data?.locks.length === 0) return <Alert severity="warning">It looks like <b>{username}</b> doesn't have any public locks yet :(</Alert>;
  return data.locks.map(l => <PLock key={l._id} lock={l}/>);
});
PLocks.displayName = 'PLocks';

function PublicLocks({ setSubNav }){
  const { username } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profileData, error: profileError } = useQuery(GetPublicProfile, { variables: { username }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (profileError) enqueueSnackbar(profileError.toString(), { variant: 'error' });
  }, [profileError, enqueueSnackbar]);

  const notFound = useMemo(() => profileData?.profile === null, [profileData]);

  if (notFound) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error: User not found!</AlertTitle>
      A Chaster user with the username <b>{username}</b> doesn't exist.
    </Alert>
  );

  return (
    <>
      <ScrollElement name="profile" style={{ paddingBottom: 8 }}>
        <Typography variant="h4" gutterBottom component="p">Public profile of {profileData?.profile?.user.username || username}</Typography>
        { profileData ? <JsonView src={profileData.profile} collapsed={2}/> : <Skeleton variant="rectangular" width="100%" height={300}/> }
      </ScrollElement>
      <Typography variant="h4" gutterBottom component="p">Public locks of {profileData?.profile?.user.username || username}</Typography>
      { profileData ? <PLocks userId={profileData.profile.user._id} enqueueSnackbar={enqueueSnackbar} setSubNav={setSubNav} username={profileData.profile.user.username || username}/>
                    : <Skeleton variant="rectangular" width="100%" height={300}/> }
    </>
  );
}

export default memo(PublicLocks);