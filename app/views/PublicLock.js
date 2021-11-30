import { useEffect, useState } from 'react';
import { Alert, AlertTitle, Skeleton, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import VerficationPictureGalery from '../components/VerficationPictureGalery';
import JsonView from '../components/JsonView';
import { Element as ScrollElement } from 'react-scroll';

export default function PublicLocks({ setSubNav }){
  const { username } = useParams();
  const [profileJSON, setProfileJSON] = useState(null);
  const [locksJSON, setLocksJSON] = useState(null);

  useEffect(() => {
    async function fetchData(){
      const pjson = await fetch(`https://api.chaster.app/users/profile/${username}/details`).then(d => d.json());
      setProfileJSON(pjson);
      if (pjson.statusCode > 400) return setLocksJSON(null);
      const ljson = await fetch(`https://api.chaster.app/locks/user/${pjson.user._id}`).then(d => d.json());
      setLocksJSON(ljson);
    }
    fetchData();
    setProfileJSON(null);
    setLocksJSON(null);
  }, [username]);

  useEffect(() => {
    if (locksJSON) setSubNav({ public: profileJSON.user.username, locks: locksJSON.map(j => ({ id: j._id, title: j.title, hist: false, veri: j.extensions.find(e => e.slug === 'verification-picture') })) });
    return () => setSubNav(null);
  }, [profileJSON, locksJSON, setSubNav]);

  if (profileJSON?.statusCode === 404) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error: User not found!</AlertTitle>
      A Chaster user with the username <b>{username}</b> doesn't exist.
    </Alert>
  );

  return (
    <>
      <ScrollElement name="profile" style={{ paddingBottom: 8 }}>
        <Typography variant="h4" gutterBottom component="p">Public profile of {profileJSON?.user?.username || username}</Typography>
        { profileJSON ? <JsonView src={profileJSON} collapsed={2}/> : <Skeleton variant="rectangular" width="100%" height={300} /> }
      </ScrollElement>
      <Typography variant="h4" gutterBottom component="p">Public locks of {profileJSON?.user?.username || username}</Typography>
      { locksJSON?.length === 0 && <Alert severity="warning">It looks like <b>{profileJSON?.user?.username || username}</b> doesn't have any public locks yet :(</Alert> }
      { locksJSON ? locksJSON.map(j => (
        <ScrollElement key={j._id} name={j._id}>
          <ScrollElement name={`info-${j._id}`} style={{ paddingBottom: 8 }}>
            <Typography variant="h5" gutterBottom component="p">{j.title} (info):</Typography>
            <JsonView src={j} collapsed={1}/>
          </ScrollElement>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <ScrollElement name={`veri-${j._id}`} style={{ paddingBottom: 8 }}>
              <Typography variant="h5" gutterBottom component="p">{j.title} (verification pics):</Typography>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </ScrollElement>
          )}
        </ScrollElement>)) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </>
  );
}