import * as React from "react";
import { useState, useEffect } from "react";
import { Button, TextField, Skeleton, ImageList, ImageListItem, ImageListItemBar } from '@mui/material';
import ReactJson from 'react-json-view';
import SearchIcon from '@mui/icons-material/Search';
import { useParams, useNavigate } from "react-router-dom";

function VerficationPictureGalery(props){
  const [pics, setPics] = useState(null);
  useEffect(() => {
    if (props.data){
      Promise.all(props.data.map(e => fetch(`https://api.chaster.app/files/${e.imageKey}`).then(d => d.json())
                                      .then(d => { return { src : d.url, title: new Date(e.submittedAt) };})))
      .then(d => d.sort((a, b) => a.title -  b.title)).then(d => setPics(d));
    }
  }, [props.data]);

  if (!props.data) return <p>No verifications pictures found!</p>;
  if (!pics) return <Skeleton variant="rectangular" width={'100%'} height={300} />;

  return (
    <ImageList variant="masonry" cols={3} gap={8}>
      {pics.map((img) => (
        <ImageListItem key={img.title.toString()}>
          <img src={img.src} alt={img.title} loading="lazy" />
          <ImageListItemBar title={img.title.toLocaleString()} />
        </ImageListItem>
      ))}
    </ImageList>
  );
}

export default function PublicLocks(){
  const { name } = useParams();
  useEffect(() => {
    if (name) {
      setUsername(name);
      handleUsernameSearch({name});
    }
  }, []);
  const navigate = useNavigate();
  const [username, setUsername] = useState(name || '');
  const [profileJSON, setProfileJSON] = useState(null);
  const [locksJSON, setLocksJSON] = useState(null);
  const [isSearching, setSearching] = useState(false);

  const onChangeUsername = e => setUsername(e.target.value.trim());
  const handleUsernameSearch = async (e) => {
    const user = e.name || username;
    setProfileJSON(null);
    setLocksJSON(null);
    setSearching(true);
    const pjson = await fetch(`https://api.chaster.app/users/profile/${user}/details`).then(d => d.json());
    setProfileJSON(pjson);
    if (pjson.statusCode > 400) return setSearching(false);
    navigate(`/locks/${user}`);
    const ljson = await fetch(`https://api.chaster.app/locks/user/${pjson.user._id}`).then(d => d.json());
    setLocksJSON(ljson);
    setSearching(false);
  }

  return (
    <React.Fragment>
      <h1>Public Lock Profiles Search:</h1>
      <TextField label="Username" variant="outlined" value={username} onChange={onChangeUsername} size="small"/>
      <Button variant="contained" startIcon={<SearchIcon/>} onClick={handleUsernameSearch} disabled={isSearching}>Search</Button>
      { (isSearching || profileJSON) &&
        <React.Fragment>
          <h2>Public profile of {profileJSON?.user?.username || username}</h2>
          { profileJSON ? <ReactJson style={{fontSize: 13}} src={profileJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={2} name={false} />
                      : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
          <h2>Public locks of {profileJSON?.user?.username || username}</h2>
          { locksJSON ? <ReactJson style={{fontSize: 13}} src={locksJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={2} name={false} />
                  : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
          <h2>Verification Pictures of {profileJSON?.user?.username || username}</h2>
          { locksJSON ? <VerficationPictureGalery data={locksJSON[0]?.extensions.find(e => e.slug === 'verification-picture')?.userData.history} />
                  : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
        </React.Fragment>
      }
    </React.Fragment>
  );
}