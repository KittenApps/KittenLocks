import { memo, useEffect, useMemo, useState } from 'react';
import { useRealmApp } from '../RealmApp';
import { Paper, Skeleton } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import LoginModal from './LoginModal';

function RequiredScopes({ rScopes, component, children }){
  const onMissingScopes = useOutletContext();
  const app = useRealmApp();
  const scopes = useMemo(() => app.currentUser?.customData?.scopes, [app.currentUser?.customData?.scopes]);
  const [openLogin, showLogin] = useState(null);
  useEffect(() => {
    showLogin(scopes ? !rScopes.every(s => scopes.includes(s)) : true);
  }, [rScopes, scopes]);

  if (openLogin === null) return <p>loading...</p>;
  if (!openLogin) return children;
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h2><Skeleton variant="text"/></h2>
      <Skeleton variant="rectangular" width="100%" height="300px"/>
      <LoginModal rScopes={rScopes} onMissingScopes={onMissingScopes} component={component}/>
    </Paper>
  );
}

export default memo(RequiredScopes);