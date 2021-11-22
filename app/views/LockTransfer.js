import { useEffect, useState } from 'react';
import { useRealmApp } from '../RealmApp';
import { useSearchParams } from 'react-router-dom';
import { Alert, AlertTitle, Button, FormControl, InputLabel, MenuItem, Paper, Select, Step, StepContent, StepLabel, Stepper, TextField } from '@mui/material';
import ReactJson from 'react-json-view';

function VerifyLock(props){
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!props.lock) return;
    if (props.lock.status !== 'locked'){
      setResult(<p>❌ lock already unlocked</p>);
    } else if (!props.lock.keyholder){
      setResult(<p>✅ in self lock</p>);
      props.setLockOkay(true);
    } else if (props.lock.keyholder.isDisabled){
      setResult(<p>✅ keyholder is suspended</p>);
      props.setLockOkay(true);
    } else if (props.lock.keyholder.lastSeen > 7 * 24 * 60 * 60){
      setResult(<p>✅ keyholder inactive for more than 1 week</p>);
      props.setLockOkay(true);
    } else {
      const timerVisible = props.lock.isAllowedToViewTime;
      const remainingTime = timerVisible && (new Date(props.lock.endDate).getTime() - Date.now()) / 3600000 < 2;
      setResult(
        <>
          <p>{timerVisible ? '✅' : '❌' } in keyholder lock with visible timer</p>
          <p>{remainingTime ? '✅' : '❌' } timer is less than 2 hours</p>
        </>
      );
      if (timerVisible && remainingTime) props.setLockOkay(true);
    }
  }, [props]);

  if (!props.lock) return null;

  return (
    <>
      {result}
      <ReactJson style={{ fontSize: 13 }} src={props.lock} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed name={false} theme="harmonic"/>
    </>
  );
}

export default function LockTransfer(props){
  const app = useRealmApp();
  const [searchParams] = useSearchParams();

  const [activeStep, setActiveStep] = useState(0);

  const [oldLockID, setOldLockID] = useState('');
  const [locks, setLocks] = useState([]);
  const [isLockOkay, setLockOkay] = useState(false);

  useEffect(() => {
    app.getAccessToken().then(({ accessToken }) => {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      return fetch('https://api.chaster.app/locks', { headers }).then(d => d.json()).then(j => {setLocks(j); setOldLockID(j[0]?._id || '');});
    });
  }, [app]);
  const handleChangeLock = e => {setOldLockID(e.target.value); setLockOkay(false);};
  const handleNext = () => isLockOkay && setActiveStep(s => s + 1);

  const [sharedLockID, setSharedLockID] = useState(searchParams.get('lock') || '');
  const [sharedLock, setSharedLock] = useState({});
  const [password, setPassword] = useState('');

  const handleChangeSharedLockID = e => setSharedLockID(e.target.value.trim());
  const handleChangePassword = e => setPassword(e.target.value.trim());
  useEffect(() => {
    if (/^[0-9a-f]{24}$/u.test(sharedLockID)){
      fetch(`https://api.chaster.app/public-locks/${sharedLockID}`).then(d => d.json()).then(j => setSharedLock(j));
    }
  }, [sharedLockID]);

  const handleTransferLock = () => {
    app.currentUser.functions.transferLock(oldLockID, sharedLock._id, password || '')
      .then(r => props.setAlert(r.error ? { type: 'error', child: <><b>Error:</b>{r.error}</> } : { type: 'success', child: <><b>Success:</b>Lock sucessfully transfered!</> }));
  };

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <Alert severity="info">
        <AlertTitle>About Kitten Trans(fer) 🏳️‍⚧️:</AlertTitle>
        KittenTransfer allows to transfer the lock of a wearer (you) over to another shared lock without exposing the combination picture to the wearer. To do so it will:
        <ul style={{ margin: '3px 0' }}>
          <li>copy the combination from the old session</li>
          <li>abandon / desert the old session (so you don't get the combination from the old lock)</li>
          <li>start a new lock with the combination copied over from the given shared lock</li>
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
          <StepContent>
            <FormControl fullWidth>
              <InputLabel id="select-label">Your current lock:</InputLabel>
              <Select labelId="select-label" value={oldLockID} label="Your current lock:" onChange={handleChangeLock} disabled={locks.length === 0}>
                {locks.map(l => <MenuItem value={l._id} key={l._id}>{l.title} ({l._id})</MenuItem>)}
              </Select>
            </FormControl>
            <VerifyLock lock={locks.find(l => l._id === oldLockID)} setLockOkay={setLockOkay} />
            <Button onClick={handleNext} disabled={!isLockOkay} sx={{ mt: 2 }} variant="contained">Select shared lock</Button>
          </StepContent>
        </Step>
        <Step key="sharedLock">
          <StepLabel>Choose the shared lock to transfer to</StepLabel>
          <StepContent>
            <h2>Transfer to { sharedLock.name || 'shared lock (find the ID in the shared lock url)'}:</h2>
            <FormControl fullWidth>
              <TextField label="shared lock ID" value={sharedLockID} onChange={handleChangeSharedLockID} variant="outlined" />
              { sharedLock.requirePassword && <TextField label="password" value={password} onChange={handleChangePassword} variant="outlined" />}
            </FormControl>
            { sharedLock._id && <ReactJson style={{ fontSize: 13 }} src={sharedLock} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed name={false} />}
            { isLockOkay && <Button onClick={handleTransferLock} disabled={!sharedLock._id || sharedLock.user._id === locks[0].user._id || (sharedLock.requirePassword && !password)} sx={{ marginTop: 2 }} variant="contained">[BETA] Transfer Lock</Button> }
          </StepContent>
        </Step>
      </Stepper>
    </Paper>
  );
}