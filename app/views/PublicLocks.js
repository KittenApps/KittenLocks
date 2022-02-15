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
import ChasterUsernameSearch from '../graphql/ChasterUsernameSearchQuery.graphql';
import ChasterDiscordSearch from '../graphql/ChasterDiscordSearchQuery.graphql';
import ChasterIdSearch from '../graphql/ChasterIdSearchQuery.graphql';
import { useSnackbar } from 'notistack';
import throttle from 'lodash.throttle';

const fd = u => (u.discordUsername === '{}' ? '' : u.discordUsername);

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
    { o: 'Keyholder scope required', t: 'Your current Wearers', d: true },
    { o: 'KittenLocks login required', t: 'other KittenLocks users', d: true },
    { o: 'type at least 2 characters to search on Chaster', t: 'Chaster search', d: true },
    { o: 'enter a valid Discord snowflake for a Chaster user', t: 'Discord ID', d: true }
  ] : [{ o: 'Login into KittenLocks to get usernames autocompleted', t: 'Hint', d: true }]));

  const [getAllKittenLocksUsers, { data, loading, error }] = useLazyQuery(GetAllKittenLocksUsers, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);

  const [getAllWearers, { data: wdata, loading: wloading, error: werror, fetchMore }] = useLazyQuery(GetMyWearers, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (werror){
      enqueueSnackbar(werror.toString(), { variant: 'error' });
      console.error(werror);
    }
  }, [werror, enqueueSnackbar]);

  const [searchChaster, { data: cdata, previousData, loading: cloading, error: cerror }] = useLazyQuery(ChasterUsernameSearch, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (cerror){
      enqueueSnackbar(cerror.toString(), { variant: 'error' });
      console.error(cerror);
    }
  }, [cerror, enqueueSnackbar]);

  const [searchDiscord, { data: ddata, loading: dloading, error: derror }] = useLazyQuery(ChasterDiscordSearch, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (derror){
      enqueueSnackbar(derror.toString(), { variant: 'error' });
      console.error(derror);
    }
  }, [derror, enqueueSnackbar]);

  const [searchChasterId, { data: cidata, loading: ciloading, error: cierror }] = useLazyQuery(ChasterIdSearch, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (cierror){
      enqueueSnackbar(cierror.toString(), { variant: 'error' });
      console.error(cierror);
    }
  }, [cierror, enqueueSnackbar]);

  const [page, setPage] = useState(0);
  useEffect(() => {
    if (app.currentUser){
      getAllKittenLocksUsers({ variables: { userId: new BSON.ObjectID(app.currentUser.customData._id) } });
      if (new Set(app.currentUser.customData.scopes).has('keyholder')){
        getAllWearers({ variables: { realmId: app.currentUser.id, status: 'locked', page, limit: 50 } });
      }
    }
  }, [app.currentUser, getAllWearers, getAllKittenLocksUsers, page]);
  useEffect(() => {
    if (wdata && wdata.wearers.pages - 1 > page){
      fetchMore({ variables: { page: page + 1 } });
      setPage(page + 1);
    }
  }, [wdata, fetchMore, page]);

  useEffect(() => {
    if (app.currentUser){
      const yourself = { o: app.currentUser.customData.username, a: app.currentUser.customData.avatarUrl, t: 'Yourself' };
      if (!app.currentUser.customData.discordUsername.$undefined) yourself.h = app.currentUser.customData.discordUsername;
      const wearers = wdata ? wdata.wearers.locks.map(x => ({ o: x.user.username, a: x.user.avatarUrl, h: x.user.discordUsername, t: 'Your current Wearers' }))
                                         .filter((v, i, s) => s.map(x => x.o).indexOf(v.o) === i).sort((a, b) => a.o.localeCompare(b.o))
                            : (new Set(app.currentUser.customData.scopes).has('keyholder') ? [{ o: 'loading your current Wearers ...', t: 'Your current Wearers', d: true }]
                                                                                           : [{ o: 'Keyholder scope required', t: 'Your current Wearers', d: true }]);
      const set = new Set(wearers.map(o => o.o)).add(yourself.o);
      const klusers = data ? data.users.filter(u => !set.has(u.username)).map(u => ({ o: u.username, a: u.avatarUrl, h: fd(u), t: 'other KittenLocks users' }))
                                       .sort((a, b) => a.o.localeCompare(b.o)) : [{ o: 'loading other KittenLocks users ...', t: 'other KittenLocks users', d: true }];
      const set2 = new Set([...set, ...klusers.map(o => o.o)]);
      const scu = cdata ? cdata.searchChasterUsername : previousData?.searchChasterUsername;
      const search = scu && scu.length > 0 ? scu.filter(x => !set2.has(x.username)).map(x => ({ o: x.username, a: x.avatarUrl, t: 'Chaster search' }))
                                           : [{ o: 'type at least 2 characters to search on Chaster', t: 'Chaster search', d: true }];
      const discord = ddata && ddata.searchChasterDiscord ? { o: ddata.searchChasterDiscord.username, a: ddata.searchChasterDiscord.avatarUrl, t: 'Discord ID',
                                                              h: ddata.searchChasterDiscord.discordUsername, s: ddata.searchChasterDiscord.discordId }
                                                          : { o: 'enter a valid Discord snowflake for a Chaster user', t: 'Discord ID', d: true };
      const chasterId = cidata && cidata.searchChasterId ? { o: cidata.searchChasterId.username, a: cidata.searchChasterId.avatarUrl, t: 'Chaster ID',
                                                             h: cidata.searchChasterId.discordUsername, s: cidata.searchChasterId._id }
                                                         : { o: 'enter a valid ChasterId for a Chaster user', t: 'Chaster ID', d: true };
      setOptions([yourself, ...wearers, ...klusers, ...search, discord, chasterId]);
    } else {
      const chasterId = cidata && cidata.searchChasterId ? { o: cidata.searchChasterId.username, a: cidata.searchChasterId.avatarUrl, t: 'Chaster ID',
                                                             h: cidata.searchChasterId.discordUsername, s: cidata.searchChasterId._id }
                                                         : { o: 'enter a valid ChasterId for a Chaster user', t: 'Chaster ID', d: true };
      setOptions([
        { o: 'Login into KittenLocks to get usernames autocompleted and more', t: 'Hint', d: true },
        { o: 'enter the complete username for a Chaster user', t: 'Chaster Username', d: true },
        chasterId
      ]);
    }
  }, [app.currentUser, data, wdata, cdata, previousData, ddata, cidata]);
  const throttleSearchChaster = useMemo(() => throttle(n => searchChaster({ variables: { search: n } }), 1000, { leading: false, trailing: true }), [searchChaster]);
  const onChangeUsername = useCallback((e, n) => {
    setUsername(n);
    if (app.currentUser && n.length >= 2) throttleSearchChaster(n);
    if (/^[a-f\d]{24}$/ui.test(n)) searchChasterId({ variables: { chasterId: n } });
    if (app.currentUser && /^\d{17,19}$/u.test(n)) searchDiscord({ variables: { discordId: n } });
  }, [app.currentUser, searchChasterId, searchDiscord, throttleSearchChaster]);
  const handleUsernameSearch = useCallback((e, n) => {
    if (n){
      setSelected(n.o || n.trim());
      navigate(`/locks/${n.o || n.trim()}`);
    }
  }, [navigate]);
  const filterOptions = useMemo(() => createFilterOptions({ stringify: o => (o.d ? '' : `${o.o} ${o.h} ${o.s}`), trim: true }), []);
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
        endAdornment: <>{loading || wloading || cloading || dloading || ciloading ? <CircularProgress color="inherit" size={20}/> : null}{params.InputProps.endAdornment}</>
      }}
    />
  ), [loading, wloading, cloading, dloading, ciloading]);
  const renderOption = useCallback((props, op, { inputValue }) => {
    const parts1 = parse(op.o, match(op.o, inputValue, { insideWords: true }));
    const parts2 = parse(op.h, match(op.h, inputValue, { insideWords: true }));
    return (
      <Box component="li" {...props}>
        { op.d ? <Warn sx={{ mr: 2 }}/> : <Avatar alt={op.o} src={op.a} sx={{ width: 24, height: 24, mr: 2 }}/> }
        {parts1.map((p, i) => <span key={i} style={{ ...(p.highlight && { fontWeight: 900, color: '#6d7dd1' }) }}>{p.text}</span>)}
        { op.h && (
          <Typography variant="caption" color="text.secondary" ml={1}>
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
          loading={!cloading && cdata && cdata.searchChasterUsername.length === 0}
          loadingText="No Chaster user found! Enter the beginning of an existing username or a valid Discord ID."
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