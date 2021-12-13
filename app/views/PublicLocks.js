/* eslint-disable react/no-array-index-key */
import { useEffect, useState } from 'react';
import { Autocomplete, Avatar, Box, Paper, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useRealmApp } from '../RealmApp';
import { BSON } from 'realm-web';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { WarningTwoTone as Warn } from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import { Element as ScrollElement } from 'react-scroll';
import GetAllKittenLocksUsers from '../graphql/GetAllKittenLocksUsersQuery.graphql';

export default function PublicLocks({ isDesktop }){
  const app = useRealmApp();
  const navigate = useNavigate();
  const urlUsername = useMatch('locks/:username/*')?.params.username;
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(urlUsername || '');
  const [selected, setSelected] = useState(urlUsername || '');
  const [options, setOptions] = useState(app.currentUser ? [
    { o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, h: app.currentUser.customData.discordUsername, t: 'Yourself' },
    { o: 'Keyholder scope required', t: 'Your Lockees', d: true },
    { o: 'KittenLocks login required', t: 'other KittenLocks users', d: true }
  ] : [{ o: 'Login into KittenLocks to get usernames autocompleted', t: 'Hint', d: true }]);

  useEffect(() => {
    if (app.currentUser){
      setOptions(op => [{ o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, h: app.currentUser.customData.discordUsername, t: 'Yourself' }, { o: 'Keyholder scope required', t: 'Your Lockees', d: true }, ...op.slice(2)]);
      if (new Set(app.currentUser.customData.scopes).has('keyholder')) app.getAccessToken().then(({ accessToken }) => {
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        const t = 'Your Lockees';
        return fetch('https://api.chaster.app/keyholder/wearers', { headers }).then(d => d.json()).then(j => setOptions(op => {
          const unique = j.map(x => ({ o: x.user.username, a: x.user.avatarUrl, h: x.user.discordUsername, t })).filter((v, i, s) => s.map(x => x.o).indexOf(v.o) === i);
          return [op[0], ...unique.sort((a, b) => a.o.localeCompare(b.o)), ...op.slice(2).filter(x => !new Set(unique.map(l => l.o)).has(x.o))];
        }));
      });
    }
  }, [app, app.currentUser]);

  const { data } = useQuery(GetAllKittenLocksUsers, { variables: { userId: new BSON.ObjectID(app.currentUser?.customData._id) } });
  useEffect(() => {
    const t = 'other KittenLocks users';
    if (data) setOptions(op => {
      const set = new Set(op.map(o => o.o));
      return [...op.filter(o => o.t !== t), ...data.users.filter(u => !set.has(u.username)).sort((a, b) => a.username.localeCompare(b.username)).map(u => ({ o: u.username, a: u.avatarUrl, h: u.discordUsername === '{}' ? '' : u.discordUsername, t }))];
    });
  }, [data]);

  // const { loading, error, data: data2 } = useQuery(GetMyWearers);
  // console.log(loading, error, data2);

  const onChangeUsername = (e, n) => setUsername(n);
  const handleUsernameSearch = (e, n) => {
    if (n){
      setSelected(n.o || n.trim());
      navigate(`/locks/${n.o || n.trim()}`);
    }
  };
  const filterOptions = createFilterOptions({ stringify: o => (o.d ? '' : `${o.o} ${o.h}`), trim: true });
  const handleOpen = () => setOpen(true);
  const handleClose = (e, r) => (isDesktop || r !== 'blur' || username.trim() === '' || username.trim() === selected) && setOpen(false);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <ScrollElement name="search" style={{ paddingBottom: 8 }}>
        <Typography variant="h3" gutterBottom component="p">Public Lock Profile Search:</Typography>
        <Autocomplete
          value={selected}
          onChange={handleUsernameSearch}
          inputValue={username}
          onInputChange={onChangeUsername}
          disablePortal
          fullWidth
          freeSolo
          autoSelect={isDesktop}
          blurOnSelect
          clearOnEscape
          openOnFocus
          forcePopupIcon
          selectOnFocus
          open={open}
          onOpen={handleOpen}
          onClose={handleClose}
          filterOptions={filterOptions}
          renderOption={(props, op, { inputValue }) => {
            const parts1 = parse(op.o, match(op.o, inputValue, { insideWords: true }));
            const parts2 = parse(op.h, match(op.h, inputValue, { insideWords: true }));
            return (
              <Box component="li" {...props}>
                { op.d ? <Warn sx={{ mr: 2 }}/> : <Avatar alt={op.o} src={op.a || 'https://api.chaster.app/users/avatar/default_avatar.jpg'} sx={{ width: 24, height: 24, mr: 2 }}/> }
                {parts1.map((p, i) => <span key={i} style={{ ...(p.highlight && { fontWeight: 900, color: '#6d7dd1' }) }}>{p.text}</span>)}
                { op.h && <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>({parts2.map((p, i) => <span key={i} style={{ ...(p.highlight && { fontWeight: 900, color: '#6d7dd1' }) }}>{p.text}</span>)})</Typography> }
              </Box>
            );
          }}
          groupBy={o => o.t}
          getOptionLabel={o => o.o || o}
          getOptionDisabled={o => o.d}
          options={options}
          renderInput={params => <TextField {...params} label="Username"/>}
        />
      </ScrollElement>
      <Outlet/>
    </Paper>
  );
}