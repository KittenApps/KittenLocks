import { useRealmApp } from '../RealmApp';
import { Paper, Skeleton } from '@mui/material';
import LoginModal from './LoginModal';

export default function RequiredScopes(props){
  const app = useRealmApp();
  const scopes = app.currentUser?.customData?.scopes;

  if (scopes && props.scopes.every(s => scopes.includes(s))) return props.children;
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h2><Skeleton variant="text"/></h2>
      <Skeleton variant="rectangular" width="100%" height="300px"/>
      <LoginModal scopes={props.scopes} onMissingScopes={props.onMissingScopes} component={props.component}/>
    </Paper>
  );
}