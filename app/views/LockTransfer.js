import { memo, useCallback, useEffect, useState } from 'react';
import { useRealmApp } from '../RealmApp';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertTitle, Button, FormControl, IconButton, InputAdornment, InputLabel, MenuItem, Paper,
         Select, Skeleton, Stack, Step, StepContent, StepLabel, Stepper, TextField } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { CompareArrows, Search } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import JsonView from '../components/JsonView';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import GetMyLocks from '../graphql/GetMyLocksQuery.graphql';
import GetSharedLock from '../graphql/GetSharedLockQuery.graphql';
import TransferLockMutation from '../graphql/TransferLockMutation.graphql';

const VerifyLock = memo(({ lock, setLockOkay }) => {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!lock) return;
    if (lock.status !== 'locked'){
      setResult(<p>❌ lock already unlocked</p>);
    } else if (!lock.keyholder){
      setResult(<p>✅ in self lock</p>);
      setLockOkay(true);
    } else if (lock.keyholder.isDisabled){
      setResult(<p>✅ keyholder is suspended</p>);
      setLockOkay(true);
    } else if (lock.keyholder.lastSeen > 7 * 24 * 60 * 60){
      setResult(<p>✅ keyholder inactive for more than 1 week</p>);
      setLockOkay(true);
    } else {
      const timerVisible = lock.isAllowedToViewTime;
      const remainingTime = timerVisible && (lock.endDate.getTime() - Date.now()) / 3600000 < 2;
      setResult(
        <>
          <p>{timerVisible ? '✅' : '❌' } in keyholder lock with visible timer</p>
          <p>{remainingTime ? '✅' : '❌' } timer is less than 2 hours</p>
        </>
      );
      if (timerVisible && remainingTime) setLockOkay(true);
    }
  }, [lock, setLockOkay]);

  if (!lock) return null;

  return (
    <>
      {result}
      <JsonView src={lock} collapsed/>
    </>
  );
});
VerifyLock.displayName = 'VerifyLock';

function LockTransfer(){
  const app = useRealmApp();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams] = useSearchParams();

  const [activeStep, setActiveStep] = useState(0);

  const [oldLockID, setOldLockID] = useState('');
  const [isLockOkay, setLockOkay] = useState(false);

  const { data, error, refetch } = useQuery(GetMyLocks, { variables: { status: 'active', realmId: app.currentUser.id }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (data) setOldLockID(data.locks[0]?._id || '');
  }, [data]);
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);

  const [sharedLockID, setSharedLockID] = useState(searchParams.get('lock') || '');
  const [getSharedLock, { data: sdata, error: serror }] = useLazyQuery(GetSharedLock, { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (serror){
      enqueueSnackbar(serror.toString(), { variant: 'error' });
      console.error(serror);
    }
  }, [serror, enqueueSnackbar]);
  const [sharedLock, setSharedLock] = useState({});
  const [password, setPassword] = useState('');

  const handleChangeSharedLockID = useCallback(e => setSharedLockID(e.target.value.trim()), []);
  const handleSelectSharedLockId = useCallback(() => {
    const sharedLockId = sharedLockID.match(/(?:chaster.app\/explore\/)?(?<id>[\da-f]{24})$/u)?.groups?.id;
    if (sharedLockId){
      if (sdata?.sharedLock?._id === sharedLockId) return setSharedLock(sdata.sharedLock);
      return getSharedLock({ variables: { sharedLockId } });
    }
    setSharedLock({});
  }, [getSharedLock, sdata, sharedLockID]);
  const handleKeyDownSharedLock = useCallback(e => e.key === 'Enter' && handleSelectSharedLockId(), [handleSelectSharedLockId]);
  useEffect(() => {
    if (sdata) setSharedLock(sdata.sharedLock);
  }, [sdata]);
  const handleChangePassword = useCallback(e => setPassword(e.target.value.trim()), []);

  const [transferLock, { data: mdata, loading: mloading, error: merror }] = useMutation(TransferLockMutation);
  useEffect(() => {
    if (merror){
      enqueueSnackbar(merror.toString(), { variant: 'error' });
      console.error(merror);
    }
  }, [merror, enqueueSnackbar]);
  const handleTransferLock = useCallback(() => transferLock({ variables: { lockID: oldLockID, sharedLockID: sharedLock._id, password } }), [oldLockID, password, sharedLock._id, transferLock]);
  useEffect(() => {
    if (mdata && mdata.transferLock){
      enqueueSnackbar('Success: Lock sucessfully transfered!', { variant: 'success' });
      setActiveStep(0);
      setLockOkay(false);
      setSharedLock({});
      setPassword('');
      refetch();
    }
  }, [mdata, enqueueSnackbar, refetch]);

  const handleChangeLock = useCallback(e => {setOldLockID(e.target.value); setLockOkay(false);}, []);
  const handleNext = useCallback(() => {
    if (isLockOkay){
      setActiveStep(1);
      handleSelectSharedLockId();
    }
  }, [handleSelectSharedLockId, isLockOkay]);
  const handelBack = useCallback(() => setActiveStep(0), []);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <Alert severity="info">
        <AlertTitle>About Kitten Trans(fer) 🏳️‍⚧️:</AlertTitle>
        KittenTransfer allows to transfer the lock of a wearer (you) over to another shared lock without exposing the combination picture to the wearer. To do so it will:
        <ul style={{ margin: '3px 0' }}>
          <li>copy the combination from the old session</li>
          <li>abandon / desert the old session (so you don't get the combination from the old lock)</li>
          <li>start a new lock from the given shared lock with the combination from the old lock copied over</li>
        </ul>
        Please not doing so will reset your current locked time and you'll start from 0 again. (Copying time over would require official support from Chaster).<br/>
        To be able to transfer you lock, you're required to fullfil either:
        <ul style={{ margin: '3px 0' }}>
          <li>you're in a self lock or</li>
          <li>your keyholder was inactive for over 1 week (or their account was suspended) or</li>
          <li>your keyholder agreed to the transfer by setting your lock with visible timer to less than 2 hours remaining (preferably frozen)</li>
        </ul>
        Also you can't transfer to your own shared lock obviously.<br/>
        If you want to transfer someones lock from an external other keyholding site to Chaster, please message Silizia#8216 on Discord.
      </Alert>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="currentLock">
          <StepLabel>Select and verify your current lock</StepLabel>
          { data ? (
            <StepContent>
              <FormControl fullWidth>
                <InputLabel id="select-label">Your current lock:</InputLabel>
                <Select labelId="select-label" value={oldLockID} label="Your current lock:" onChange={handleChangeLock} disabled={data.locks.length === 0}>
                  {data.locks.map(l => <MenuItem value={l._id} key={l._id}>{l.title} ({l._id})</MenuItem>)}
                </Select>
                { data.locks?.length === 0 && <Alert severity="error" sx={{ m: 2 }}><b>Error:</b> It looks like you aren't in any active locks currently.</Alert> }
              </FormControl>
              <VerifyLock lock={data.locks.find(l => l._id === oldLockID)} setLockOkay={setLockOkay} />
              <Button onClick={handleNext} disabled={!isLockOkay} sx={{ mt: data.locks?.length === 0 ? 0 : 2 }} variant="contained">Select shared lock</Button>
            </StepContent>
          ) : <Skeleton variant="rectangular" width="100%" height={300}/> }
        </Step>
        <Step key="sharedLock">
          <StepLabel>Choose the shared lock to transfer to</StepLabel>
          <StepContent>
            <h2>Transfer to { sharedLock.name || 'shared lock (find the ID in the shared lock url)'}:</h2>
            <FormControl fullWidth sx={{ mb: sharedLock._id ? 2 : 0 }}>
              <TextField label="shared lock ID" value={sharedLockID} onChange={handleChangeSharedLockID} onBlur={handleSelectSharedLockId} onKeyDown={handleKeyDownSharedLock} variant="outlined" InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={handleSelectSharedLockId} edge="end"><Search/></IconButton></InputAdornment> }}/>
              { sharedLock.requirePassword && <TextField label="password" value={password} onChange={handleChangePassword} variant="outlined" /> }
            </FormControl>
            { sharedLock._id && <JsonView src={sharedLock} collapsed/>}
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handelBack}>Back</Button>
              <LoadingButton loading={mloading} loadingPosition="end" endIcon={<CompareArrows/>} onClick={handleTransferLock} disabled={mloading || !isLockOkay || !sharedLock._id || sharedLock.user._id === data.locks[0].user._id || (sharedLock.requirePassword && !password)} sx={{ marginTop: 2 }} variant="contained" fullWidth>Transfer Lock</LoadingButton>
            </Stack>
          </StepContent>
        </Step>
      </Stepper>
    </Paper>
  );
}

export default memo(LockTransfer);