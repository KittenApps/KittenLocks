import { forwardRef, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Grid, LinearProgress,
         Paper, Skeleton, Stack, ToggleButton, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { Code, CodeOff, ExpandMore, Refresh } from '@mui/icons-material';
import RequiredScopes from '../components/RequiredScopes';
import JsonView from '../components/JsonView';
import { useRealmApp } from '../RealmApp';
import { useQuery } from '@apollo/client';
import GetChasterEvent from '../graphql/GetChasterEventQuery.graphql';
import GetPublicProfile from '../graphql/GetPublicProfileQuery.graphql';
import { useSnackbar } from 'notistack';

const Progress = forwardRef((props, ref) => <div ref={ref}><LinearProgress {...props}/></div>);
Progress.displayName = 'Progress';

const EventDay = memo(({ day, app, expanded }) => { // eslint-disable-line sonarjs/cognitive-complexity, complexity
  const [viewSource, setViewSource] = useState(false);
  const isTinyScreen = useMediaQuery(theme => theme.breakpoints.down('sm'), { noSsr: true });
  const { enqueueSnackbar } = useSnackbar();
  const date = useMemo(() => day.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Los_Angeles' }), [day]);
  const dateLong = useMemo(() => day.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Los_Angeles', year: 'numeric' }), [day]);
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
  const total = useMemo(() => data && data.chasterEvent.categories.extensions + data.chasterEvent.categories.interaction + data.chasterEvent.categories.community, [data]);
  const rainbowProgress = useMemo(() => data && (
    <Stack direction="row" flexGrow={1} mx={1}>
      <Tooltip title={`Interact with locks: ${data.chasterEvent.categories.extensions}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.extensions / 2.2}%`}><LinearProgress variant="determinate" color="error" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Activity: ${data.chasterEvent.categories.interaction}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.interaction / 2.2}%`}><LinearProgress variant="determinate" color="warning" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`Participate in the community: ${data.chasterEvent.categories.community}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${data.chasterEvent.categories.community / 2.2}%`}><LinearProgress variant="determinate" color="success" value={100}/></Box>
      </Tooltip>
      <Tooltip title={`missing Interact with locks points: ${100 - data.chasterEvent.categories.extensions}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(100 - data.chasterEvent.categories.extensions) / 2.2}%`}><LinearProgress variant="determinate" color="error" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing Activity points: ${100 - data.chasterEvent.categories.interaction}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(100 - data.chasterEvent.categories.interaction) / 2.2}%`}><LinearProgress variant="determinate" color="warning" value={0}/></Box>
      </Tooltip>
      <Tooltip title={`missing Participate in the community points: ${20 - data.chasterEvent.categories.community}`} arrow componentsProps={tooltipProps} placement="bottom">
        <Box py={1} width={`${(20 - data.chasterEvent.categories.community) / 2.2}%`}><LinearProgress variant="determinate" color="success" value={0}/></Box>
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
                    <li>Interact with locks points: {data.chasterEvent.categories.extensions}/100</li>
                    <li>Activity points: {data.chasterEvent.categories.interaction}/100</li>
                    <li>Participate in the community: {data.chasterEvent.categories.community}/20</li>
                    { data.chasterEvent.categories.challenges > 0 && <li>Complete a weekly challenge: {data.chasterEvent.categories.challenges} per week</li> }
                  </ul>
                }
                arrow
                placement="bottom-end"
                componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
              >
                <Typography variant="caption" color={total === 220 ? 'lightgreen' : 'white'} width={64}>{total}/220{data.chasterEvent.categories.challenges > 0 && ' ★'}</Typography>
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
              <Box minWidth={140} textAlign="right"><b>Interact with locks:</b></Box>
              <Box width="100%" mx={1}><LinearProgress variant="determinate" color={data.chasterEvent.categories.extensions === 100 ? 'success' : 'primary'} value={data.chasterEvent.categories.extensions}/></Box>
              <Box minWidth={50}>
                <Tooltip
                  title={
                    <ul style={{ margin: '4px', paddingLeft: '8px' }}>
                      <li>Wearer:
                        <ul>
                          <li>Roll the dice: {data.chasterEvent.actions.dice}</li>
                          <li>Turn the Wheel of Fortune: {data.chasterEvent.actions.wheel_of_fortune}</li>
                          <li>Complete a task: {data.chasterEvent.actions.complete_task}</li>
                          <li>Post a verification picture: {data.chasterEvent.actions.verification_picture}</li>
                        </ul>
                      </li>
                      <li>Keyholder:
                        <ul>
                          <li>Add or remove time on a lock: {data.chasterEvent.actions.change_time}</li>
                          <li>Freeze or unfreeze a lock: {data.chasterEvent.actions.toggle_freeze}</li>
                          <li>Show or hide the timer: {data.chasterEvent.actions.toggle_timer_visibility}</li>
                          <li>Assign a task: {data.chasterEvent.actions.assign_task}</li>
                          <li>Request a verification picture: {data.chasterEvent.actions.request_verification_picture}</li>
                        </ul>
                      </li>
                    </ul>
                  }
                  arrow
                  placement="bottom-end"
                  componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
                >
                  <Typography variant="caption" color={data.chasterEvent.categories.extensions === 100 ? 'lightgreen' : 'white'}>{data.chasterEvent.categories.extensions}/100</Typography>
                </Tooltip>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={140} textAlign="right"><b>Activity:</b></Box>
              <Stack direction="row" flexGrow={1} mx={1}>
                <Tooltip title={`Add or remove time to another user: ${data.chasterEvent.actions.vote}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.vote}%`}><LinearProgress variant="determinate" color="error" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Receive a vote from another user: ${data.chasterEvent.actions.receive_vote}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.receive_vote}%`}><LinearProgress variant="determinate" color="warning" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Vote for a user task: ${data.chasterEvent.actions.vote_task}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.vote_task}%`}><LinearProgress variant="determinate" color="success" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Verify a picture: ${data.chasterEvent.actions.verify_picture}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.verify_picture}%`}><LinearProgress variant="determinate" color="info" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`missing points: ${100 - data.chasterEvent.categories.interaction}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${100 - data.chasterEvent.categories.interaction}%`}><LinearProgress variant="determinate" color="primary" value={0}/></Box>
                </Tooltip>
              </Stack>
              <Box minWidth={50}>
                <Tooltip
                  title={
                    <ul style={{ margin: '4px', paddingLeft: '8px' }}>
                      <li>Add or remove time to another user: {data.chasterEvent.actions.vote}</li>
                      <li>Receive a vote from another user: {data.chasterEvent.actions.receive_vote}</li>
                      <li>Vote for a user task: {data.chasterEvent.actions.vote_task}</li>
                      <li>Verify a picture: {data.chasterEvent.actions.verify_picture}</li>
                    </ul>
                  }
                  arrow
                  placement="bottom-end"
                  componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
                >
                  <Typography variant="caption" color={data.chasterEvent.categories.interaction === 100 ? 'lightgreen' : 'white'}>{data.chasterEvent.categories.interaction}/100</Typography>
                </Tooltip>
              </Box>
            </Box>
            <Box display="flex" alignItems="center">
              <Box minWidth={140} textAlign="right"><b>community:</b></Box>
              <Stack direction="row" flexGrow={1} mx={1}>
                <Tooltip title={`Log in to Chaster: ${data.chasterEvent.actions.log_in}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.log_in * 5}%`}><LinearProgress variant="determinate" color="error" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`Post on our Discord server: ${data.chasterEvent.actions.post_on_discord}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${data.chasterEvent.actions.post_on_discord * 5}%`}><LinearProgress variant="determinate" color="warning" value={100}/></Box>
                </Tooltip>
                <Tooltip title={`missing points: ${20 - data.chasterEvent.categories.community}`} arrow componentsProps={tooltipProps} placement="bottom">
                  <Box py={1} width={`${(20 - data.chasterEvent.categories.community) * 5}%`}><LinearProgress variant="determinate" color="primary" value={0}/></Box>
                </Tooltip>
              </Stack>
              <Box minWidth={50}>
                <Tooltip
                  title={
                    <ul style={{ margin: '4px', paddingLeft: '8px' }}>
                      <li>Log in to Chaster: {data.chasterEvent.actions.log_in}</li>
                      <li>Post on our Discord server: {data.chasterEvent.actions.post_on_discord}</li>
                    </ul>
                  }
                  arrow
                  placement="bottom-end"
                  componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
                >
                  <Typography variant="caption" color={data.chasterEvent.categories.community === 20 ? 'lightgreen' : 'white'}>{data.chasterEvent.categories.community}/20</Typography>
                </Tooltip>
              </Box>
            </Box>
            { data.chasterEvent.categories.challenges > 0 && (
              <Box display="flex" alignItems="center">
                <Box minWidth={140} textAlign="right"><b>weekly challenges:</b></Box>
                <Box width="100%" mx={1}><LinearProgress variant="determinate" color="success" value={100}/></Box>
                <Box minWidth={50}>
                  <Tooltip
                    title="Complete a weekly challenge. Only counted once per week on the day of completion."
                    arrow
                    placement="bottom-end"
                    componentsProps={{ tooltip: { sx: { mt: '7px !important' } } }}
                  >
                    <Typography variant="caption" color="lightgreen">{data.chasterEvent.categories.challenges}/w</Typography>
                  </Tooltip>
                </Box>
              </Box>
            ) }
          </>
        )) : <Skeleton variant="rectangular" width="100%" height={144}/>}
      </AccordionDetails>
    </Accordion>
  );
});
EventDay.displayName = 'EventDay';

const TotalPoints = memo(({ app }) => {
  const { enqueueSnackbar } = useSnackbar();
  const isTinyScreen = useMediaQuery(theme => theme.breakpoints.down('sm'), { noSsr: true });
  const { data, error, refetch } = useQuery(GetPublicProfile, { variables: { username: app.currentUser.customData.username }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  const handleRefresh = useCallback(() => refetch(), [refetch]);
  if (!data) return <Skeleton variant="rectangular" width="100%" height={36.5}/>;
  return (
    <Typography variant="h6" gutterBottom>
      { !isTinyScreen && 'Your current '}total points:
      <Chip color="primary" variant="elevated" label={`${data.profile.user.metadata.locktober2024Points.toLocaleString()} XP`} sx={{ mx: 2, '& .MuiChip-label': { fontWeight: 'bold' } }}/>
      <Button variant="outlined" startIcon={<Refresh/>} onClick={handleRefresh}>refresh</Button>
    </Typography>
  );
});
TotalPoints.displayName = 'TotalPoints';

const ChasterEvent = memo(() => {
  const app = useRealmApp();
  const accordion = useMemo(() => {
    const a = [];
    const start = 1727769600000; // 2024-10-01T08:00:00.000Z
    const now = Math.min(Date.now(), 1730447999999); // 2024-11-01T07:59:59.999Z
    for (let i = now; i > start; i -= 86400000) a.push(<EventDay expanded={i === now} day={new Date(i)} app={app} key={i}/>);
    return a;
  }, [app]);
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }}>
      <Typography variant="h4" gutterBottom component="p">Your Locktober 2024 Event Progress 🎃:</Typography>
      <TotalPoints app={app}/>
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