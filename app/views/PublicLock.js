import { Fragment, useEffect, useState } from 'react';
import { Alert, AlertTitle, Skeleton } from '@mui/material';
import ReactJson from 'react-json-view';
import { useParams } from 'react-router-dom';
import VerficationPictureGalery from '../components/VerficationPictureGalery';

export default function PublicLocks(){
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
  }, [username]);

  if (profileJSON?.statusCode === 404) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      <AlertTitle>Error: User not found!</AlertTitle>
      A Chaster user with the username <b>{username}</b> doesn't exist.
    </Alert>
  );

  return (
    <>
      <h2>Public profile of {profileJSON?.user?.username || username}</h2>
      { profileJSON ? <ReactJson style={{ fontSize: 13 }} src={profileJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={2} name={false} theme="harmonic"/>
                    : <Skeleton variant="rectangular" width="100%" height={300} /> }
      <h2>Public locks of {profileJSON?.user?.username || username}</h2>
      { locksJSON?.length === 0 && <Alert severity="warning">It looks like <b>{profileJSON?.user?.username || username}</b> doesn't have any public locks yet :(</Alert> }
      { locksJSON ? locksJSON.map(j => (
        <Fragment key={j._id}>
          <h3>{j.title} (info):</h3>
          <ReactJson style={{ fontSize: 13 }} src={j} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} name={false} theme="harmonic"/>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <>
              <h3>{j.title} (verification pics):</h3>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </>
          )}
        </Fragment>)) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </>
  );
}