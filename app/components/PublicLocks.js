import * as React from "react";
import { useState, useEffect } from "react";
import { Button, TextField, Skeleton } from '@mui/material';
import ReactJson from 'react-json-view';
import SearchIcon from '@mui/icons-material/Search';
import { useParams, useHistory } from "react-router-dom";

export default function PublicLocks(){
  const { name } = useParams();
  useEffect(() => {
    if (name) {
      setUsername(name);
      handleUsernameSearch({name});
    }
  }, []);
  const history = useHistory();
  const [username, setUsername] = useState(name || '');
  const [profileJSON, setProfileJSON] = useState(null);
  const [locksJSON, setLocksJSON] = useState(null);
  const [isSearching, setSearching] = useState(false);

  const onChangeUsername = e => setUsername(e.target.value);
  const handleUsernameSearch = async (e) => {
    const user = e.name || username;
    setProfileJSON(null);
    setLocksJSON(null);
    setSearching(true);
    const pjson = await fetch(`https://api.chaster.app/users/profile/${user}/details`).then(d => d.json());
    setProfileJSON(pjson);
    if (pjson.statusCode > 400) return setSearching(false);
    history.push(`/locks/${user}`);
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
          { profileJSON ? <ReactJson src={profileJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={2} name={false} />
                      : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
          <h2>Public locks of {profileJSON?.user?.username || username}</h2>
          { locksJSON ? <ReactJson src={locksJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={2} name={false} />
                  : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
        </React.Fragment>
      }
    </React.Fragment>
  );
}