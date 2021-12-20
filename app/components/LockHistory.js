import { memo, useEffect, useState } from 'react';
import { LinearProgress, Skeleton, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import JsonView from '../components/JsonView';
import LockChart from '../components/LockChart';
import { useQuery } from '@apollo/client';
import { Refresh } from '@mui/icons-material';
import GetLockHistory from '../graphql/GetLockHistoryQuery.graphql';
import { useSnackbar } from 'notistack';

function LockHistory({ lockId, startTime, startRem, title }){
  const [inProgress, setInProgress] = useState(true);
  const { enqueueSnackbar } = useSnackbar(); // d && !d.lockHistory.hasMore && setInProgress(false)
  const { data, error, fetchMore } = useQuery(GetLockHistory, { variables: { lockId, limit: 100 } });
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
    if (data && !data.lockHistory.hasMore) setInProgress(false);
  }, [data, fetchMore]);

  const handleRefresh = () => {
    setInProgress(true);
    fetchMore({ variables: { limit: 100 } }).then(d => !d.data.lockHistory.hasMore && setInProgress(false));
  };

  return (
    <>
      <Typography variant="h5" gutterBottom component="p">
        {title}
        <LoadingButton loading={inProgress} loadingPosition="end" endIcon={<Refresh/>} onClick={handleRefresh} disabled={inProgress} variant="outlined" sx={{ float: 'right' }}>Refresh</LoadingButton>
      </Typography>
      { inProgress && data && <LinearProgress variant="buffer" value={data.lockHistory.results.length / data.lockHistory.count * 100} valueBuffer={(data.lockHistory.results.length + 100) / data.lockHistory.count * 100}/> }
      { !data || error ? <Skeleton variant="rectangular" width="100%" height={300}/> : <JsonView src={data.lockHistory.results} collapsed={0}/> }
      { !inProgress && !error && startTime !== 0 && <LockChart history={data.lockHistory.results} startTime={startTime} startRem={startRem}/> }
    </>
  );
}

export default memo(LockHistory);