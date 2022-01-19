import { memo } from 'react';
import { Paper } from '@mui/material';

function Discord({ open, username }){
  return (
    <Paper elevation={6} sx={{ position: 'absolute', backgroundColor: '#1b192a', top: { xs: 56, md: 80 }, left: { xs: 0, md: open ? 256 : 16 }, right: { xs: 0, md: 16 }, bottom: { xs: 0, md: 16 }, p: 2 }} >
      <iframe src={`https://e.widgetbot.io/channels/879777377541033984/879777377968869465${username ? `?username=${encodeURIComponent(username)}` : ''}`} title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"/>
    </Paper>
  );
}

export default memo(Discord);