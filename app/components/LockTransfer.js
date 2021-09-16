import * as React from "react";
import { useState, useEffect } from "react";
import { useRealmApp } from "../RealmApp";
import { useParams } from "react-router-dom";
import { Alert, AlertTitle, Stepper, Step, StepLabel, StepContent, Select, MenuItem, InputLabel, FormControl, Button, TextField } from '@mui/material';
import ReactJson from 'react-json-view';

function VerifyLock(props){
  if (!props.lock) return null;
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!props.lock.keyholder){
      setResult(<p>✅ in self lock</p>);
      props.setLockOkay(true); 
    } else {
      const timerVisible = props.lock.isAllowedToViewTime;
      const remainingTime = timerVisible && (new Date(props.lock.endDate) - new Date())/3600000 < 2;
      setResult(
        <React.Fragment>
          <p>{timerVisible ? '✅' : '❌' } in keyholder lock with visible timer</p>
          <p>{remainingTime ? '✅' : '❌' } timer is less than 2 hours</p>
        </React.Fragment>
      );
      if (timerVisible && remainingTime) props.setLockOkay(true);
    }
  }, [props.lock]);
  
  return (
    <React.Fragment>
      {result}
      <ReactJson src={props.lock} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={true} name={false} />
    </React.Fragment>
  );
}

export default function LockTransfer(){
  const app = useRealmApp();
  const { lock } = useParams();

  const [activeStep, setActiveStep] = useState(0);

  const [oldLockID, setOldLockID] = useState('');
  const [locks, setLocks] = useState([]);
  const [isLockOkay, setLockOkay] = useState(false);

  useEffect(() => {
    app.getAccessToken().then(({accessToken}) => {
      const headers = { "Authorization": `Bearer ${accessToken}` };
      return fetch('https://api.chaster.app/locks', { headers }).then(d => d.json()).then(j => {setLocks(j); setOldLockID(j[0]?._id || '');});
    });
  }, []);
  const handleChangeLock = e => {setOldLockID(e.target.value); setLockOkay(false)};
  const handleNext = () => isLockOkay && setActiveStep(s => s + 1 );

  const [sharedLockID, setSharedLockID] = useState(lock || '');
  const [sharedLock, setSharedLock] = useState({});
  const [password, setPassword] = useState('');
  
  const handleChangeSharedLockID = (e) => setSharedLockID(e.target.value);
  const handleChangePassword = e => setPassword(e.target.value);
  useEffect(() => {
    if (/^[0-9a-f]{24}$/.test(sharedLockID)){
      fetch(`https://api.chaster.app/public-locks/${sharedLockID}`).then(d => d.json()).then(j => setSharedLock(j));
    }
  }, [sharedLockID])

  const handleTransferLock = () => {
    app.currentUser.functions.transferLock(oldLockID, sharedLock._id).then(console.log);
  };


  return (
    <React.Fragment>
      <Alert severity="info">
        <AlertTitle>About Kitten Trans(fer) 🏳️‍⚧️:</AlertTitle>
        KittenTransfer allows to transfer the lock of a wearer (you) over to another shared lock without exposing the combination picture to the wearer. To do so it will:
        <ul style={{margin: '3px 0'}}>
          <li>copy the combination from the old session</li>
          <li>abandon / desert the old session (so you don't get the combination from the old lock)</li>
          <li>start a new lock with the combination copied over from the given shared lock</li>
        </ul>
        Please not doing so will reset your current locked time and you'll start from 0 again. (Copying time over would require official support from Chaster).<br/>
        Requirements for a lock transfer are, that you're either in a self lock or your keyholder has approved the transfer by setting your lock to below 2 hours with visible timer and frozen (recommended).
      </Alert>
      <Stepper activeStep={activeStep} orientation="vertical">
        <Step key="currentLock">
          <StepLabel>Select and verify your current lock</StepLabel>
          <StepContent>
            <FormControl fullWidth>
              <InputLabel id="select-label">Your current lock:</InputLabel>
              <Select labelId="select-label" value={oldLockID} label="Your current lock:" onChange={handleChangeLock}>
              {locks.map((l) => <MenuItem value={l._id} key={l._id}>{l.title} ({l._id})</MenuItem> )}
              </Select>
            </FormControl>
            <VerifyLock lock={locks.find(l => l._id === oldLockID)} setLockOkay={setLockOkay} />
            <Button onClick={handleNext} disabled={!isLockOkay} sx={{ marginTop: 2 }} variant="contained">Select shared lock</Button>
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
            { sharedLock._id && <ReactJson src={sharedLock} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={true} name={false} />}
            { isLockOkay && <Button onClick={handleTransferLock} disabled={!sharedLock._id || sharedLock.user._id === locks[0].user._id || (sharedLock.requirePassword && !password) } sx={{ marginTop: 2 }} variant="contained">Transfer Lock ...</Button> }
          </StepContent>
        </Step>
      </Stepper>
    </React.Fragment>
  );
}