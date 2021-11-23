import { Fragment, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, FormControl, Grid, InputLabel, LinearProgress, MenuItem,
         Paper, Select, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ProgressBar from 'react-bootstrap/ProgressBar';
import ReactJson from 'react-json-view';
import { useRealmApp } from '../RealmApp';
import '../bootstrap.scss';
import VerficationPictureGalery from '../components/VerficationPictureGalery';

function LocktoberCalc(props){
  const today = 31;
  const [calc, setCalc] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    props.app.getAccessToken().then(({ accessToken }) => {
      const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      const arr = [];
      for (let i = 0; i < today; i++) arr[i] = i + 1;
      return Promise.all(arr.map(i => fetch('https://api.chaster.app/locktober/details', { headers, signal, method: 'POST',
        body: JSON.stringify({ 'date': `2021-10-${(i < 10) ? `0${i}` : i}T23:00:00.000Z` }) }).then(d => d.json()).then(d => {
          const p = d.categories;
          setCalc(c => ({ ...c, [i]: p.extensions + p.peer_verifications + p.receive_votes + p.task_votes + p.votes, [`${i}e`]: p.discord_events }));
        })));
    });
    return () => controller.abort();
  }, [props.app]);

  const handleClick = d => props.setDay(d);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          <TableRow>
            <TableCell align="center">Monday</TableCell>
            <TableCell align="center">Tuesday</TableCell>
            <TableCell align="center">Wednesday</TableCell>
            <TableCell align="center">Thursday</TableCell>
            <TableCell align="center">Friday</TableCell>
            <TableCell align="center">Saturday</TableCell>
            <TableCell align="center">Sunday</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[0, 1, 2, 3, 4].map(i => (
            <TableRow key={i}>
              {[0, 1, 2, 3, 4, 5, 6].map(j => (
                <TableCell align="center" key={j} onClick={() => handleClick(i * 7 + j - 3)}>
                  {i * 7 + j - 3 > 0 ? (
                    <>
                      <b>{i * 7 + j - 3}.: </b>{calc[i * 7 + j - 3]}/610{calc[`${i * 7 + j - 3}e`] > 0 ? ` + ${calc[`${i * 7 + j - 3}e`]}` : ''}
                      <ProgressBar variant={calc[i * 7 + j - 3] === 610 ? 'success' : (calc[i * 7 + j - 3] >= 350 ? 'warning' : 'danger')} now={calc[i * 7 + j - 3]} max={610} animated={calc[`${i * 7 + j - 3}e`] > 0} />
                    </>
                  ) : null }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function Locktober(props){
  const today = 31;
  const [day, setDay] = useState(today);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (day > 0){
      const controller = new AbortController();
      const { signal } = controller;
      props.app.getAccessToken().then(({ accessToken }) => {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
        return fetch('https://api.chaster.app/locktober/details', { headers, signal, method: 'POST',
          body: JSON.stringify({ 'date': `2021-10-${day < 10 ? `0${day}` : day}T23:00:00.000Z` }) }).then(d => d.json()).then(d => setProgress(d.actions));
      });
      return () => controller.abort();
    }
  }, [day, props.app]);

  const handleChangeDay = e => setDay(e.target.value);
  const handleRefresh = () => {setDay(0); setTimeout(() => setDay(today), 1);};

  if (!progress || day === 0) return (<Skeleton variant="rectangular" width="100%" height={300} />);
  const items = [];
  for (let i = 1; i <= 31; i++){
    items.push(<MenuItem value={i} key={i}>{i}</MenuItem>);
  }
  return (
    <>
      <Grid container direction="row" spacing={2} alignItems="center">
        <Grid item xs={3}>
          <FormControl fullWidth>
            <InputLabel id="select-day">Day</InputLabel>
            <Select labelId="select-day" value={day} label="Day" size="small" onChange={handleChangeDay} >
              {items}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs><b>Locktober 2021 🎃🔒</b></Grid>
        <Grid item xs={3}>
          <FormControl fullWidth>
            <Button onClick={handleRefresh} startIcon={<RefreshIcon/>} variant="outlined">{today === day ? 'refresh' : 'today'}</Button>
          </FormControl>
        </Grid>
      </Grid>
      <br/>
      <Grid container spacing={1}>
        <Grid item xs={3}><b>Extensions (60):</b></Grid>
        <Grid item xs={9}>
          <ProgressBar>
            <ProgressBar variant="info" now={progress.dice} label={`${progress.dice} Dice`} max={60} key={0}/>
            <ProgressBar variant="success" now={progress.wheel_of_fortune} label={`${progress.wheel_of_fortune} WoF`} max={60} key={1} />
            <ProgressBar variant="warning" now={progress.complete_task} label={`${progress.complete_task} Tasks`} max={60} key={2} />
            <ProgressBar variant="danger" now={progress.verification_picture} label={`${progress.verification_picture} Verify`} max={60} key={3} />
          </ProgressBar>
        </Grid>
        <Grid item xs={3}><b>Votes (100):</b></Grid>
        <Grid item xs={9}><ProgressBar variant="success" now={progress.vote} max={100} label={`${progress.vote}/100`} /></Grid>
        <Grid item xs={3}><b>Receive votes (200):</b></Grid>
        <Grid item xs={9}><ProgressBar variant="success" now={progress.receive_vote} max={200} label={`${progress.receive_vote}/200`} /></Grid>
        <Grid item xs={3}><b>Vote for user tasks (50):</b></Grid>
        <Grid item xs={9}><ProgressBar variant="success" now={progress.vote_task} max={50} label={`${progress.vote_task}/50`} /></Grid>
        <Grid item xs={3}><b>Peer verifications (200):</b></Grid>
        <Grid item xs={9}><ProgressBar variant="success" now={progress.verify_picture} max={200} label={`${progress.verify_picture}/200`} /></Grid>
        <Grid item xs={3}><b>Discord Events:</b></Grid>
        <Grid item xs={9}><ProgressBar variant="success" now={progress.discord_event > 0 ? 100 : 0} animated label={`${progress.discord_event}`} /></Grid>
      </Grid>
      <Accordion TransitionProps={{ mountOnEnter: true }} sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}><b>Locktober points calendar 🎃🔒📆</b></AccordionSummary>
        <AccordionDetails><LocktoberCalc app={props.app} setDay={setDay}/></AccordionDetails>
      </Accordion>
    </>
  );
}

function LockHistory(props){
  const [historyJSON, setHistoryJSON] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    props.app.getAccessToken().then(({ accessToken }) => {
      const fetchHistory = async lastId => {
        const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
        const ch = await fetch(`https://api.chaster.app/locks/${props.id}/history`, { headers, signal, method: 'POST', body: JSON.stringify({ lastId, limit: 100 }) }).then(d => d.json());
        setHistoryJSON(h => [...h, ...ch.results]);
        if (ch.hasMore) await fetchHistory(ch.results[99]._id);
      };
      return fetchHistory();
    }).then(() => setLoading(false));
    return () => controller.abort();
  }, [props.app, props.id]);

  return (
    <>
      { loading && <LinearProgress/>}
      { historyJSON ? <ReactJson style={{ fontSize: 13 }} src={historyJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} name={false} theme="harmonic"/>
              : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </>
  );
}

export default function MyLock(){
  const app = useRealmApp();
  const [locksJSON, setLocksJSON] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    app.getAccessToken().then(({ accessToken }) => {
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      return fetch('https://api.chaster.app/locks', { headers, signal });
    }).then(d => d.json()).then(j => setLocksJSON(j));
    return () => controller.abort();
  }, [app]);

  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <h2>My Locktober progress</h2>
      <Locktober app={app}/>
      <h2>{app.currentUser.customData.username}'s Locks:</h2>
      { locksJSON?.length === 0 && <Alert severity="warning">It looks like you aren't in any active locks currently :(</Alert> }
      { locksJSON ? locksJSON.map(j => (
        <Fragment key={j._id}>
          <h3>{j.title} (info):</h3>
          <ReactJson style={{ fontSize: 13 }} src={j} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} name={false} theme="harmonic"/>
          <h3>{j.title} (history):</h3>
          <LockHistory app={app} id={j._id}/>
          { j.extensions.find(e => e.slug === 'verification-picture') && (
            <>
              <h3>{j.title} (verification pics):</h3>
              <VerficationPictureGalery data={j.extensions.find(e => e.slug === 'verification-picture')?.userData.history}/>
            </>
          )}
        </Fragment>)) : <Skeleton variant="rectangular" width="100%" height={300} /> }
    </Paper>
  );
}