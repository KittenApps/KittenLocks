import { memo, useMemo } from 'react';
import { Paper } from '@mui/material';
import { useRealmApp } from '../RealmApp';

function Discord(){
  const app = useRealmApp();
  const params = useMemo(() => (app.currentUser?.customData ? `?${new URLSearchParams({ username: app.currentUser.customData.username, avatar: app.currentUser.customData.avatarUrl })}` : ''), [app.currentUser?.customData]);

  return (
    <Paper elevation={6} sx={{ position: 'absolute', backgroundColor: '#1b192a', top: { xs: 56, md: 80 }, left: { xs: 0, md: 256 }, right: { xs: 0, md: 16 }, bottom: { xs: 0, md: 16 }, p: 2 }} >
      <iframe src={`https://e.widgetbot.io/channels/879777377541033984/879777377968869465${params}`} title="Discord Wifget" style={{ width: '100%', height: '100%', border: 'none' }} allow="clipboard-write; fullscreen"/>
    </Paper>
  );
}

export default memo(Discord);