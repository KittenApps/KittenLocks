import { useState } from 'react';
import { Button, Paper, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import gql from 'graphql-tag';

const GetAllUsernames = gql`
  query GetAllUsernames {
    users {
      username
    }
  }
`;

const GetMyScopes = gql`
  query GetMyScopes($userId: ObjectId!)  {
    user(_id: $userId) {
      username
      scopes
      access {
        accessToken
        accessExpires
        error
      }
    }
  }
`;

export default function PublicLocks(){
  const navigate = useNavigate();
  const [username, setUsername] = useState(name || '');

  const { data, loading, error } = useQuery(GetAllUsernames);
  // const { data: d, loading: l, error: err, refetch: r } = useQuery(GetMyScopes, {variables: { userId: '' }});
  console.log(data, loading, error);

  const onChangeUsername = e => setUsername(e.target.value.trim());
  const handleUsernameSearch = () => navigate(`/locks/${username}`);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h1>Public Lock Profiles Search:</h1>
      <TextField label="Username" variant="outlined" value={username} onChange={onChangeUsername} size="small"/>
      <Button variant="contained" startIcon={<SearchIcon/>} onClick={handleUsernameSearch}>Search</Button>
      <Outlet/>
    </Paper>
  );
}