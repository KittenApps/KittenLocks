import { memo, useCallback, useEffect, useMemo, useState} from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Paper, LinearProgress, Skeleton, ToggleButton, Typography } from '@mui/material';
import { Code, CodeOff, ExpandMore, Refresh } from '@mui/icons-material';
import RequiredScopes from '../components/RequiredScopes';
import JsonView from '../components/JsonView';
import { useRealmApp } from '../RealmApp';
import { useQuery } from '@apollo/client';
import GetChasterEvent from '../graphql/GetChasterEventQuery.graphql';
import { useSnackbar } from 'notistack';

const EventDay = memo(({ day, app, expanded }) => {
  const [viewSource, setViewSource] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const date = day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }); // eslint-disable-line no-undefined
  const { data, error, refetch } = useQuery(GetChasterEvent, { variables: { date: day.toISOString(), realmId: app.currentUser.id },
                                                      fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  const handleRefresh = useCallback(() => refetch(), [refetch]);
  const handleViewSource = useCallback(() => setViewSource(!viewSource), [viewSource]);
  return (
    <Accordion defaultExpanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMore/>}>
        <Typography>{date}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
        <Button variant="outlined" startIcon={<Refresh/>} onClick={handleRefresh}>refresh</Button>
        <ToggleButton size="small" selected={viewSource} onChange={handleViewSource}>
          {viewSource ? <><CodeOff sx={{ mr: 1 }}/>Hide Source</> : <><Code sx={{ mr: 1 }}/>View Source</> }
        </ToggleButton>
        {data ? (viewSource ? <JsonView src={data.chasterEvent} collapsed={2}/> : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>Extensions:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant="determinate" value={(data.chasterEvent.actions.verification_picture + data.chasterEvent.actions.complete_task + data.chasterEvent.actions.wheel_of_fortune + data.chasterEvent.actions.dice) * 5 / 3}/></Box>
              <Box sx={{ width: 86 }}>
                {data.chasterEvent.actions.verification_picture + data.chasterEvent.actions.complete_task + data.chasterEvent.actions.wheel_of_fortune + data.chasterEvent.actions.dice}/60
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>Votes:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant="determinate" value={data.chasterEvent.actions.vote}/></Box>
              <Box sx={{ width: 86 }}>{data.chasterEvent.actions.vote}/100</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>Receive votes:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant="determinate" value={data.chasterEvent.actions.receive_vote / 2}/></Box>
              <Box sx={{ width: 86 }}>{data.chasterEvent.actions.receive_vote}/200</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>User tasks votes:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant="determinate" value={data.chasterEvent.actions.vote_task * 2}/></Box>
              <Box sx={{ width: 86 }}>{data.chasterEvent.actions.vote_task}/50</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>Peer verifications:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant="determinate" value={data.chasterEvent.actions.verify_picture / 2}/></Box>
              <Box sx={{ width: 86 }}>{data.chasterEvent.actions.verify_picture}/200</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 182, textAlign: 'right' }}><b>Discord Events:</b></Box>
              <Box sx={{ width: '100%', mx: 1 }}><LinearProgress variant={`${data.chasterEvent.actions.discord_event > 0 ? 'in' : ''}determinate`} value={0}/></Box>
              <Box sx={{ width: 86 }}>+{data.chasterEvent.actions.discord_event}</Box>
            </Box>
          </>
        )) : <Skeleton variant="rectangular" width="100%" height={150}/>}
      </AccordionDetails>
    </Accordion>
  );
});
EventDay.displayName = 'EventDay';

const ChasterEvent = memo(() => {
  const app = useRealmApp();
  const accordion = useMemo(() => {
    const a = [];
    const start = 1642147200000; // 2022-01-14T08:00:00.000Z
    const now = Date.now();
    for (let i = now; i > start; i -= 86400000) a.push(<EventDay expanded={i === now} day={new Date(i)} app={app} key={i}/>);
    return a;
  }, [app]);
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="p">Your Chastity Month Event Progress 💖:</Typography>
      {accordion}
    </Paper>
  );
});
ChasterEvent.displayName = 'ChasterEvent';

function PermissionWrapper({ onMissingScopes }){
  return (
    <RequiredScopes rScopes={[]} onMissingScopes={onMissingScopes} component="event">
      <ChasterEvent/>
    </RequiredScopes>
  );
}

export default memo(PermissionWrapper);