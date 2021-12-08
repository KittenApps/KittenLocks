import { memo } from 'react';
import { useRealmApp } from '../RealmApp';
import { Paper, Skeleton } from '@mui/material';
import LoginModal from './LoginModal';

function RequiredScopes({ rScopes, onMissingScopes, component, children }){
  const app = useRealmApp();
  const scopes = app.currentUser?.customData?.scopes;

  if (scopes && rScopes.every(s => scopes.includes(s))) return children;
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h2><Skeleton variant="text"/></h2>
      <Skeleton variant="rectangular" width="100%" height="300px"/>
      <LoginModal rScopes={rScopes} onMissingScopes={onMissingScopes} component={component}/>
    </Paper>
  );
}

export default memo(RequiredScopes);