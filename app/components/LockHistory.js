import { memo, useEffect, useState } from 'react';
import { LinearProgress, Skeleton } from '@mui/material';
import JsonView from '../components/JsonView';
import LockChart from '../components/LockChart';
import { useQuery } from '@apollo/client';
import GetLockHistory from '../graphql/GetLockHistoryQuery.graphql';
import { useSnackbar } from 'notistack';

function LockHistory({ lockId, startTime, startRem }){
  const [inProgress, setInProgress] = useState(true);
  const { enqueueSnackbar } = useSnackbar();
  const { data, error, fetchMore } = useQuery(GetLockHistory, { variables: { lockId, limit: 100 } });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  useEffect(() => {
    if (data && data.lockHistoryResult.hasMore) fetchMore({ variables: { lastId: data.lockHistoryResult.results.at(-1)._id } });
    if (data && !data.lockHistoryResult.hasMore) setInProgress(false);
  }, [data, fetchMore]);

  return (
    <>
      { inProgress && data && <LinearProgress variant="buffer" value={data.lockHistoryResult.results.length / data.lockHistoryResult.count * 100} valueBuffer={(data.lockHistoryResult.results.length + 100) / data.lockHistoryResult.count * 100}/> }
      { !data || error ? <Skeleton variant="rectangular" width="100%" height={300}/> : <JsonView src={data.lockHistoryResult.results} collapsed={0}/> }
      { !inProgress && !error && startTime !== 0 && <LockChart history={data.lockHistoryResult.results} startTime={startTime} startRem={startRem}/> }
    </>
  );
}

export default memo(LockHistory);