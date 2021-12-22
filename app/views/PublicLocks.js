/* eslint-disable react/no-array-index-key */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Autocomplete, Avatar, Box, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useRealmApp } from '../RealmApp';
import { BSON } from 'realm-web';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { WarningTwoTone as Warn } from '@mui/icons-material';
import { useLazyQuery } from '@apollo/client';
import { Element as ScrollElement } from 'react-scroll';
import GetAllKittenLocksUsers from '../graphql/GetAllKittenLocksUsersQuery.graphql';
import GetMyWearers from '../graphql/GetMyWearersQuery.graphql';
import { useSnackbar } from 'notistack';

function PublicLocks({ isDesktop }){
  const app = useRealmApp();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const urlUsername = useMatch('locks/:username/*')?.params.username;
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(urlUsername || '');
  const [selected, setSelected] = useState(urlUsername || '');
  const [options, setOptions] = useState(() => (app.currentUser ? [
    { o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, h: app.currentUser.customData.discordUsername, t: 'Yourself' },
    { o: 'Keyholder scope required', t: 'Your Lockees', d: true },
    { o: 'KittenLocks login required', t: 'other Kitte)nLocks users', d: true }
  ] : [{ o: 'Login into KittenLocks to get usernames autocompleted', t: 'Hint', d: true }]));

  const [getAllKittenLocksUsers, { data, loading, error }] = useLazyQuery(GetAllKittenLocksUsers, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);

  const [getAllWearers, { data: wdata, loading: wloading, error: werror }] = useLazyQuery(GetMyWearers, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (werror){
      enqueueSnackbar(werror.toString(), { variant: 'error' });
      console.error(werror);
    }
  }, [werror, enqueueSnackbar]);

  useEffect(() => {
    if (app.currentUser){
      getAllKittenLocksUsers({ variables: { userId: new BSON.ObjectID(app.currentUser.customData._id) } });
      if (new Set(app.currentUser.customData.scopes).has('keyholder')){
        getAllWearers({ variables: { realmId: app.currentUser.id, status: 'all', pathBuilder: () => '/keyholder/wearers' } });
      }
    } // keep app scope here to refresh on newly granted keyholder scope
  }, [app, app.currentUser, getAllWearers, getAllKittenLocksUsers]);

  useEffect(() => {
    if (app.currentUser){
      const yourself = { o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, h: app.currentUser.customData.discordUsername, t: 'Yourself' };
      const wearers = wdata ? wdata.locks.map(x => ({ o: x.user.username, a: x.user.avatarUrl, h: x.user.discordUsername, t: 'Your Lockees' }))
                                         .filter((v, i, s) => s.map(x => x.o).indexOf(v.o) === i).sort((a, b) => a.o.localeCompare(b.o))
                            : (new Set(app.currentUser.customData.scopes).has('keyholder') ? [{ o: 'loading your lockees ...', t: 'Your Lockees', d: true }]
                                                                                           : [{ o: 'Keyholder scope required', t: 'Your Lockees', d: true }]);
      const set = new Set(wearers.map(o => o.o)).add(yourself.o);
      const fd = u => (u.discordUsername === '{}' ? '' : u.discordUsername);
      const klusers = data ? data.users.filter(u => !set.has(u.username)).map(u => ({ o: u.username, a: u.avatarUrl, h: fd(u), t: 'other KittenLocks users' }))
                                       .sort((a, b) => a.o.localeCompare(b.o)) : [{ o: 'loading other KittenLocks users ...', t: 'other KittenLocks users', d: true }];
      setOptions([yourself, ...wearers, ...klusers]);
    } else {
      setOptions([{ o: 'Login into KittenLocks to get usernames autocompleted', t: 'Hint', d: true }]);
    }
  }, [app.currentUser, data, wdata]);

  const onChangeUsername = useCallback((e, n) => setUsername(n), []);
  const handleUsernameSearch = useCallback((e, n) => {
    if (n){
      setSelected(n.o || n.trim());
      navigate(`/locks/${n.o || n.trim()}`);
    }
  }, [navigate]);
  const filterOptions = useMemo(() => createFilterOptions({ stringify: o => (o.d ? '' : `${o.o} ${o.h}`), trim: true }), []);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback((e, r) => (isDesktop || r !== 'blur' || username.trim() === '' || username.trim() === selected) && setOpen(false), [isDesktop, selected, username]);
  const groupBy = useCallback(o => o.t, []);
  const getOptionLabel = useCallback(o => o.o || o, []);
  const getOptionDisabled = useCallback(o => o.d, []);
  const renderInput = useCallback(params => (
    <TextField
      {...params}
      label="Username"
      InputProps={{
        ...params.InputProps,
        endAdornment: <>{loading || wloading ? <CircularProgress color="inherit" size={20}/> : null}{params.InputProps.endAdornment}</>
      }}
    />
  ), [loading, wloading]);
  const renderOption = useCallback((props, op, { inputValue }) => {
    const parts1 = parse(op.o, match(op.o, inputValue, { insideWords: true }));
    const parts2 = parse(op.h, match(op.h, inputValue, { insideWords: true }));
    return (
      <Box component="li" {...props}>
        { op.d ? <Warn sx={{ mr: 2 }}/> : <Avatar alt={op.o} src={op.a} sx={{ width: 24, height: 24, mr: 2 }}/> }
        {parts1.map((p, i) => <span key={i} style={{ ...(p.highlight && { fontWeight: 900, color: '#6d7dd1' }) }}>{p.text}</span>)}
        { op.h && (
          <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
            ({parts2.map((p, i) => <span key={i} style={{ ...(p.highlight && { fontWeight: 900, color: '#6d7dd1' }) }}>{p.text}</span>)})
          </Typography>
        )}
      </Box>
    );
  }, []);

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
          renderOption={renderOption}
          groupBy={groupBy}
          getOptionLabel={getOptionLabel}
          getOptionDisabled={getOptionDisabled}
          options={options}
          renderInput={renderInput}
        />
      </ScrollElement>
      <Outlet/>
    </Paper>
  );
}

export default memo(PublicLocks);