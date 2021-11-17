import { useState, Fragment } from "react";
import { Button, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, Outlet } from "react-router-dom";


export default function PublicLocks(){
  const navigate = useNavigate();
  const [username, setUsername] = useState(name || '');
  const [isSearching, setSearching] = useState(false); // ToDo

  const onChangeUsername = e => setUsername(e.target.value.trim());
  const handleUsernameSearch = (e) => navigate(`/locks/${username}`);

  return (
    <Fragment>
      <h1>Public Lock Profiles Search:</h1>
      <TextField label="Username" variant="outlined" value={username} onChange={onChangeUsername} size="small"/>
      <Button variant="contained" startIcon={<SearchIcon/>} onClick={handleUsernameSearch} disabled={isSearching}>Search</Button>
      <Outlet />
    </Fragment>
  );
}