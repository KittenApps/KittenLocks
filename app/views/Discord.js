import { memo } from 'react';
import { Paper } from '@mui/material';

function Discord({ isDesktop }){
  return (
    <Paper elevation={6} sx={{ position: 'absolute', backgroundColor: '#1b192a', top: isDesktop ? 80 : 64, left: isDesktop ? (open ? 256 : 16) : 0, right: isDesktop ? 16 : 0, bottom: isDesktop ? 16 : 0, p: 2 }} >
      <iframe src="https://e.widgetbot.io/channels/879777377541033984/879777377968869465" title="Discord" width="100%" height="100%" allowtransparency="true" frameBorder="0"/>
    </Paper>
  );
}

export default memo(Discord);