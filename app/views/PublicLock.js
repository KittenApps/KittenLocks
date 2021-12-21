import { memo, useEffect, useMemo } from 'react';
import { Alert, AlertTitle, Skeleton, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import VerificationPictureGallery from '../components/VerificationGallery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';
import { useQuery } from '@apollo/client';
import { GetPublicLocks, GetPublicProfile } from '../graphql/GetPublicLocksQuery.graphql';
import { useSnackbar } from 'notistack';

const PLocks = memo(({ userId, enqueueSnackbar, setSubNav, username }) => {
  const { data, loading, error } = useQuery(GetPublicLocks, { variables: { userId } });
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

  if (loading || error) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  if (data?.locks.length === 0) return <Alert severity="warning">It looks like <b>{username}</b> doesn't have any public locks yet :(</Alert>;
  return (
    <>
      { data.locks.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (info):</Typography>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.title} (verification pics):</Typography>
              <VerificationPictureGallery history={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>
      ))}
    </>
  );
});
PLocks.displayName = 'PLocks';

function PublicLocks({ setSubNav }){
  const { username } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const { data: profileData, loading: profileLoading, error: profileError } = useQuery(GetPublicProfile, { variables: { username } });
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
        { profileLoading || profileError ? <Skeleton variant="rectangular" width="100%" height={300} /> : <JsonView src={profileData.profile} collapsed={2}/> }
      </ScrollElement>
      <Typography variant="h4" gutterBottom component="p">Public locks of {profileData?.profile?.user.username || username}</Typography>
      { profileLoading || profileError ? <Skeleton variant="rectangular" width="100%" height={300} />
        : <PLocks userId={profileData.profile.user._id} enqueueSnackbar={enqueueSnackbar} setSubNav={setSubNav} username={profileData.profile.user.username || username}/> }
    </>
  );
}

export default memo(PublicLocks);