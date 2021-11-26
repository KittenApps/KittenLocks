import { useState } from 'react';
import { Autocomplete, Paper, TextField } from '@mui/material';
import { Outlet, useNavigate, useMatch } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';

const GetAllUsernames = gql`
  query GetAllUsernames {
    users {
      username
    }
  }
`;

/*
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
*/

export default function PublicLocks(){
  const navigate = useNavigate();
  const [username, setUsername] = useState(useMatch('locks/:username/*')?.params.username || '');

  const { data, loading, error } = useQuery(GetAllUsernames);
  // const { data: d, loading: l, error: err, refetch: r } = useQuery(GetMyScopes, {variables: { userId: '' }});
  // console.log(data, loading, error);

  const onChangeUsername = (e, n) => setUsername(n.trim());
  const handleUsernameSearch = (e, n) => navigate(`/locks/${n}`);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h1>Public Lock Profiles Search:</h1>
      <Autocomplete
        onChange={handleUsernameSearch}
        inputValue={username}
        onInputChange={onChangeUsername}
        disablePortal
        fullWidth
        freeSolo
        autoSelect
        blurOnSelect
        clearOnEscape
        openOnFocus
        forcePopupIcon
        selectOnFocus
        loading={loading}
        options={data?.users.map(u => u.username).sort() || []}
        renderInput={params => <TextField {...params} label="Username"/>}
      />
      <Outlet/>
    </Paper>
  );
}