import { memo, useCallback, useEffect, useMemo } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Paper, Skeleton, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import RequiredScopes from '../components/RequiredScopes';
import JsonView from '../components/JsonView';
import { useRealmApp } from '../RealmApp';
import { useQuery } from '@apollo/client';
import GetChasterEvent from '../graphql/GetChasterEventQuery.graphql';
import { useSnackbar } from 'notistack';

const EventDay = memo(({ day, app, expanded }) => {
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
  const handleRefresh = useCallback(e => {refetch(); e.stopPropagation();}, [refetch]);
  return (
    <Accordion defaultExpanded={expanded}>
      <AccordionSummary expandIcon={<ExpandMore/>}>
        <Typography>{date}<Button onClick={handleRefresh}>reload</Button></Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
        {data ? <JsonView src={data.chasterEvent} collapsed={2}/> : <Skeleton variant="rectangular" width="100%" height={150}/>}
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
    <RequiredScopes rScopes={['profile']} onMissingScopes={onMissingScopes} component="event">
      <ChasterEvent/>
    </RequiredScopes>
  );
}

export default memo(PermissionWrapper);