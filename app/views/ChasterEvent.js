import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, LinearProgress,
         Paper, Skeleton, Stack, ToggleButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { Code, CodeOff, ExpandMore, Refresh } from '@mui/icons-material';
import RequiredScopes from '../components/RequiredScopes';
import JsonView from '../components/JsonView';
import { useRealmApp } from '../RealmApp';
import { useQuery } from '@apollo/client';
import GetChasterEvent from '../graphql/GetChasterEventQuery.graphql';
import { useSnackbar } from 'notistack';

const Progress = forwardRef((props, ref) => <div ref={ref}><LinearProgress {...props}/></div>);
Progress.displayName = 'Progress';

const EventDay = memo(({ day, app, expanded }) => { // eslint-disable-line sonarjs/cognitive-complexity, complexity
  const [viewSource, setViewSource] = useState(false);
  const isTinyScreen = useMediaQuery(theme => theme.breakpoints.down('sm'), { noSsr: true });
  const { enqueueSnackbar } = useSnackbar();
  const date = useMemo(() => day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Los_Angeles' }), [day]); // eslint-disable-line no-undefined
  const dateLong = useMemo(() => day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Los_Angeles', year: 'numeric' }), [day]); // eslint-disable-line no-undefined
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
  const tooltipProps = useMemo(() => ({ tooltip: { sx: { mt: '6px !important' } } }), []);
  const total = useMemo(() => data && data.chasterEvent.categories.extensions + data.chasterEvent.categories.votes + data.chasterEvent.categories.receive_votes +
                                      data.chasterEvent.categories.task_votes + data.chasterEvent.categories.peer_verifications, [data]);
  const rainbowProgress = useMemo(() => data && (
    <Stack direction="row" flexGrow={1} mx={1}>
      <Tooltip title={`Extensions points: ${data.chasterEvent.categories.extensions}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.extensions / 6.1}%`}><LinearProgress variant="determinate" color="error" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Votes points: ${data.chasterEvent.categories.votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.votes / 6.1}%`}><LinearProgress variant="determinate" color="warning" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Received votes points: ${data.chasterEvent.categories.receive_votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.receive_votes / 6.1}%`}><LinearProgress variant="determinate" color="success" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Vote for user tasks points: ${data.chasterEvent.categories.task_votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.task_votes / 6.1}%`}><LinearProgress variant="determinate" color="info" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Peer verification points: ${data.chasterEvent.categories.peer_verifications}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.peer_verifications / 6.1}%`}><LinearProgress variant="determinate" color="primary" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`missing extensions points: ${60 - data.chasterEvent.categories.extensions}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(60 - data.chasterEvent.categories.extensions) / 6.1}%`}><LinearProgress variant="determinate" color="error" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing votes points: ${100 - data.chasterEvent.categories.votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(100 - data.chasterEvent.categories.votes) / 6.1}%`}><LinearProgress variant="determinate" color="warning" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing received votes points: ${200 - data.chasterEvent.categories.receive_votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(200 - data.chasterEvent.categories.receive_votes) / 6.1}%`}><LinearProgress variant="determinate" color="success" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing vote for user tasks points: ${50 - data.chasterEvent.categories.task_votes}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(50 - data.chasterEvent.categories.task_votes) / 6.1}%`}><LinearProgress variant="determinate" color="info" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing peer verification points: ${200 - data.chasterEvent.categories.peer_verifications}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(200 - data.chasterEvent.categories.peer_verifications) / 6.1}%`}><LinearProgress variant="determinate" color="primary" value={0}/></Box>
      </Tooltip>
    </Stack>
  ), [data, tooltipProps]);
  return (
    <Accordion defaultExpanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMore/>}>
        <Box alignItems="center" display="flex" width="100%" mb={isTinyScreen ? 1 : 0}>
          <Typography width={100} flexGrow={isTinyScreen ? 1 : 0}>{date}</Typography>
          { data && (
            <>
              { !isTinyScreen && rainbowProgress }
              <Tooltip
                title={
                  <ul style={{ margin: '4px', paddingLeft: '8px' }}>
                    <li>Extensions points: {data.chasterEvent.categories.extensions}/60</li>
                    <li>Votes points: {data.chasterEvent.categories.votes}/100</li>
                    <li>Received votes points: {data.chasterEvent.categories.receive_votes}/200</li>
                    <li>Vote for user tasks points: {data.chasterEvent.categories.task_votes}/50</li>
                    <li>Peer verification points: {data.chasterEvent.categories.peer_verifications}/200</li>
                    <li>Discord Events bonus points: + {data.chasterEvent.categories.discord_events}</li>
                  </ul>
                }
                arrow
                placement="bottom-end"
                componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
              >
                <Stack direction="row" width={90}>
                  <Typography variant="caption" color={total === 610 ? 'lightgreen' : 'white'} width={52}>{total}/610</Typography>
                  <Typography variant="caption" color={data.chasterEvent.categories.discord_events > 0 ? 'lightgreen' : 'white'} width={38}>+ {data.chasterEvent.categories.discord_events}</Typography>
                </Stack>
              </Tooltip>
            </>
          ) }
        </Box>
        { isTinyScreen && data && <Box position="absolute" left={8} right={8} bottom={4}>{rainbowProgress}</Box> }
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
        <Grid container rowSpacing={1} columnSpacing={2} alignItems="center" justifyContent="end" mb={1}>
          <Grid item xs={12} sm><Typography variant="h6">{dateLong}:</Typography></Grid>
          <Grid item xs="auto"><Button variant="outlined" startIcon={<Refresh/>} onClick={handleRefresh}>refresh</Button></Grid>
          <Grid item xs="auto">
            <ToggleButton value={viewSource} size="small" selected={viewSource} onChange={handleViewSource} sx={{ width: 136 }}>
              {viewSource ? <><CodeOff sx={{ mr: 1 }}/>Hide Source</> : <><Code sx={{ mr: 1 }}/>View Source</> }
            </ToggleButton>
          </Grid>
        </Grid>
        {data ? (viewSource ? <JsonView src={data.chasterEvent} collapsed={2}/> : (
          <>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>Extensions:</b></Box>
              <Stack direction="row" flexGrow={1} mx={1}>
                <Tooltip title={`Verifications Pictures: ${data.chasterEvent.actions.verification_picture}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.verification_picture / 20 * 33.3333333}%`}><LinearProgress variant="determinate" color="error" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Completed Tasks: ${data.chasterEvent.actions.complete_task}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.complete_task / 20 * 33.3333333}%`}><LinearProgress variant="determinate" color="warning" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Wheel of Fortune: ${data.chasterEvent.actions.wheel_of_fortune}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.wheel_of_fortune / 20 * 33.3333333}%`}><LinearProgress variant="determinate" color="success" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Dice: ${data.chasterEvent.actions.dice}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.dice / 20 * 33.3333333}%`}><LinearProgress variant="determinate" color="info" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`missing points: ${60 - data.chasterEvent.categories.extensions}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${(60 - data.chasterEvent.categories.extensions) / 20 * 33.3333333}%`}><LinearProgress variant="determinate" color="primary" value={0}/></Box>
                </Tooltip>
              </Stack>
              <Box minWidth={50}>
                <Tooltip
                  title={
                    <ul style={{ margin: '4px', paddingLeft: '8px' }}>
                      <li>Verifications Pictures: {data.chasterEvent.actions.verification_picture}</li>
                      <li>Completed Tasks: {data.chasterEvent.actions.complete_task}</li>
                      <li>Wheel of Fortune: {data.chasterEvent.actions.wheel_of_fortune}</li>
                      <li>Dice: {data.chasterEvent.actions.dice}</li>
                    </ul>
                  }
                  arrow
                  placement="bottom-end"
                  componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
                >
                  <Typography variant="caption" color={data.chasterEvent.categories.extensions === 60 ? 'lightgreen' : 'white'}>{data.chasterEvent.categories.extensions}/60</Typography>
                </Tooltip>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>Votes:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant="determinate" color={data.chasterEvent.actions.vote === 100 ? 'success' : 'primary'} value={data.chasterEvent.actions.vote}/></Box>
              <Box minWidth={50}><Typography variant="caption" color={data.chasterEvent.actions.vote === 100 ? 'lightgreen' : 'white'}>{data.chasterEvent.actions.vote}/100</Typography></Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>Receive votes:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant="determinate" color={data.chasterEvent.actions.receive_vote === 200 ? 'success' : 'primary'} value={data.chasterEvent.actions.receive_vote / 2}/></Box>
              <Box minWidth={50}><Typography variant="caption" color={data.chasterEvent.actions.receive_vote === 200 ? 'lightgreen' : 'white'}>{data.chasterEvent.actions.receive_vote}/200</Typography></Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>User tasks votes:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant="determinate" color={data.chasterEvent.actions.vote_task === 50 ? 'success' : 'primary'} value={data.chasterEvent.actions.vote_task * 2}/></Box>
              <Box minWidth={50}><Typography variant="caption" color={data.chasterEvent.actions.vote_task === 50 ? 'lightgreen' : 'white'}>{data.chasterEvent.actions.vote_task}/50</Typography></Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>Peer verifications:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant="determinate" color={data.chasterEvent.actions.verify_picture === 200 ? 'success' : 'primary'} value={data.chasterEvent.actions.verify_picture / 2}/></Box>
              <Box minWidth={50}><Typography variant="caption" color={data.chasterEvent.actions.verify_picture === 200 ? 'lightgreen' : 'white'}>{data.chasterEvent.actions.verify_picture}/200</Typography></Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={135} textAlign="right"><b>Discord Events:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant={`${data.chasterEvent.actions.discord_event > 0 ? 'in' : ''}determinate`} color={data.chasterEvent.actions.discord_event > 0 ? 'success' : 'primary'} value={0}/></Box>
              <Box minWidth={50}><Typography variant="caption" color={data.chasterEvent.actions.discord_event > 0 ? 'lightgreen' : 'white'}>+ {data.chasterEvent.actions.discord_event}</Typography></Box>
            </Box>
          </>
        )) : <Skeleton variant="rectangular" width="100%" height={144}/>}
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
    const now = Math.min(Date.now(), 1644911999999); // 2022-02-15T07:59:59.999Z
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

function PermissionWrapper(){
  return (
    <RequiredScopes rScopes={[]} component="event">
      <ChasterEvent/>
    </RequiredScopes>
  );
}

export default memo(PermissionWrapper);