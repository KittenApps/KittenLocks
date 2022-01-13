import { memo, useCallback, useEffect, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Divider, LinearProgress, Skeleton, Tab, Typography } from '@mui/material';
import { LoadingButton, TabContext, TabList, TabPanel } from '@mui/lab';
import { Code, ExpandMore, Refresh, ShowChart, SmartToyTwoTone, ViewList } from '@mui/icons-material';
import JsonView from '../components/JsonView';
import LockChart from '../components/LockChart';
import { useQuery } from '@apollo/client';
import GetLockHistory from '../graphql/GetLockHistoryQuery.graphql';
import { useSnackbar } from 'notistack';
import { Virtuoso } from 'react-virtuoso';

const HistoryList = memo(({ history }) => {
  const itemContent = useCallback((i, e) => (
    <>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore/>}>
          <Typography sx={{ flexGrow: 1 }}>{e.title}</Typography>
          <Avatar alt={e.role === 'extension' ? e.extension : e.user.username} sx={{ width: 24, height: 24, mr: 1 }} src={e.role === 'extension' ? null : e.user.avatarUrl}><SmartToyTwoTone/></Avatar>
          <Typography variant="caption">{e.createdAt.toLocaleString()}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {JSON.stringify(e)}
        </AccordionDetails>
      </Accordion>
      <Divider/>
    </>
  ), []);
  if (!history) return <Skeleton variant="rectangular" width="100%" height={500}/>;
  return <Virtuoso data={history} itemContent={itemContent}/>;
});
HistoryList.displayName = 'HistoryList';

function LockHistory({ lockId, startTime, startRem, title }){
  const [inProgress, setInProgress] = useState(true);
  const [tab, setTab] = useState('list');
  const { enqueueSnackbar } = useSnackbar();
  const { data, error, fetchMore } = useQuery(GetLockHistory, { variables: { lockId, limit: 100 }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  useEffect(() => {
    if (data && data.lockHistory.hasMore){
      const lastId = data.lockHistory.refresh > 0 ? data.lockHistory.results[data.lockHistory.refresh - 1]._id : data.lockHistory.results.at(-1)._id;
      fetchMore({ variables: { lastId } });
    }
    if (data && data.lockHistory.hasMore) setInProgress(true);
    if (data && !data.lockHistory.hasMore) setInProgress(false);
  }, [data, fetchMore]);

  const handleRefresh = useCallback(() => {
    setInProgress(true);
    fetchMore({ variables: { limit: 100 } }).then(d => !d.data.lockHistory.hasMore && setInProgress(false));
  }, [fetchMore]);

  const handleTabChange = useCallback((e, t) => setTab(t), []);

  return (
    <>
      <Typography variant="h5" gutterBottom component="p">
        {title}
        <LoadingButton loading={inProgress} loadingPosition="end" endIcon={<Refresh/>} onClick={handleRefresh} disabled={inProgress} variant="outlined" sx={{ float: 'right' }}>Refresh</LoadingButton>
      </Typography>
      { inProgress && data && <LinearProgress variant="buffer" value={data.lockHistory.results.length / data.lockHistory.count * 100} valueBuffer={(data.lockHistory.results.length + 100) / data.lockHistory.count * 100}/> }
      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList variant="fullWidth" onChange={handleTabChange}>
            <Tab icon={<ViewList/>} iconPosition="start" label="Lock History List" value="list" />
            <Tab icon={<Code/>} iconPosition="start" label="JSON API source" value="source" disabled={!data}/>
            <Tab icon={<ShowChart/>} iconPosition="start" label="Lock Chart" value="chart" disabled={inProgress || error || startTime === 0} />
          </TabList>
        </Box>
        <TabPanel value="list" sx={{ height: 516, px: 0, pt: 2, pb: 0 }}>
          { tab === 'list' && <HistoryList history={data?.lockHistory?.results}/> }
        </TabPanel>
        <TabPanel value="source" sx={{ maxHeight: 516, overflowY: 'auto', px: 0, pt: 2, pb: 0 }}>
          { tab === 'source' && <JsonView src={data.lockHistory.results} collapsed={0}/> }
        </TabPanel>
        <TabPanel value="chart" sx={{ px: 0, pt: 2, pb: 0 }}>
          { tab === 'chart' && <LockChart history={data.lockHistory.results} startTime={startTime} startRem={startRem}/> }
        </TabPanel>
      </TabContext>
    </>
  );
}

export default memo(LockHistory);