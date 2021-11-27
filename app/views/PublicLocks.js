import { useEffect, useState } from 'react';
import { Avatar, Autocomplete, Box, Paper, TextField } from '@mui/material';
import { useRealmApp } from '../RealmApp';
import { BSON } from 'realm-web';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import WarnIcon from '@mui/icons-material/WarningTwoTone';
import { gql, useQuery } from '@apollo/client';

const GetAllUsernames = gql`
  query GetAllUsernames($userId: ObjectId!) {
    users(query: {_id_ne: $userId}, limit: 1000, sortBy: USERNAME_ASC) {
      username
      avatarUrl
    }
  }
`;

export default function PublicLocks(){
  const app = useRealmApp();
  const navigate = useNavigate();
  const match = useMatch('locks/:username/*')?.params.username;
  const [username, setUsername] = useState(match || '');
  const [selected, setSelected] = useState(match || '');
  const [options, setOptions] = useState(app.currentUser ? [
    { o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, t: 'Yourself' },
    { o: 'Keyholder scope required', t: 'Your Lockees', d: true },
    { o: 'KittenLocks login required', t: 'other KittenLocks users', d: true }
  ] : [{ o: 'Login into KittenLocks to get usernames autocompleted', t: 'Hint', d: true }]);

  useEffect(() => {
    if (app.currentUser){
      setOptions(op => [{ o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, t: 'Yourself' }, { o: 'Keyholder scope required', t: 'Your Lockees', d: true }, ...op.slice(2)]);
      if (new Set(app.currentUser.customData.scopes).has('keyholder')) app.getAccessToken().then(({ accessToken }) => {
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        const t = 'Your Lockees';
        return fetch('https://api.chaster.app/keyholder/wearers', { headers }).then(d => d.json()).then(j => setOptions(op => {
          const unique = j.map(x => ({ o: x.user.username, a: x.user.avatarUrl, t })).filter((v, i, s) => s.map(x => x.o).indexOf(v.o) === i);
          return [op[0], ...unique.sort((a, b) => a.o.localeCompare(b.o)), ...op.slice(2).filter(x => !new Set(unique.map(l => l.o)).has(x.o))];
        }));
      });
    }
  }, [app, app.currentUser]);

  const { data } = useQuery(GetAllUsernames, { variables: { userId: new BSON.ObjectID(app.currentUser?.customData._id) } });
  useEffect(() => {
    const t = 'other KittenLocks users';
    if (data) setOptions(op => {
      const set = new Set(op.map(o => o.o));
      return [...op.filter(o => o.t !== t), ...data.users.filter(u => !set.has(u.username)).sort((a, b) => a.username.localeCompare(b.username)).map(u => ({ o: u.username, a: u.avatarUrl, t }))];
    });
  }, [data]);

  const onChangeUsername = (e, n) => setUsername(n.trim());
  const handleUsernameSearch = (e, n) => {
    if (n){
      setSelected(n.o || n);
      navigate(`/locks/${n.o || n}`);
    }
  };

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h1>Public Lock Profiles Search:</h1>
      <Autocomplete
        value={selected}
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
        renderOption={(props, op) => (
          <Box component="li" {...props}>
            { op.d ? <WarnIcon sx={{ mr: 2 }}/> : <Avatar alt={op.o} src={op.a || 'https://api.chaster.app/users/avatar/default_avatar.jpg'} sx={{ width: 24, height: 24, mr: 2 }}/>}
            {op.o}
          </Box>
        )}
        groupBy={o => o.t}
        getOptionLabel={o => o.o || o}
        getOptionDisabled={o => o.d}
        options={options}
        renderInput={params => <TextField {...params} label="Username"/>}
      />
      <Outlet/>
    </Paper>
  );
}