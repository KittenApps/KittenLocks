import { memo, useMemo } from 'react';
import { Avatar, Stack } from '@mui/material';

function ScopeBadges({ scopes }){
  const p = useMemo(() => (scopes.includes('profile') ? 'lightblue' : 'grey'), [scopes]);
  const l = useMemo(() => (scopes.includes('locks') ? 'hotpink' : 'grey'), [scopes]);
  const k = useMemo(() => (scopes.includes('keyholder') ? 'violet' : 'grey'), [scopes]);
  return (
    <Stack direction="row" spacing={0.5}>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: p }} >P</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: l }} >L</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: k }} >K</Avatar>
    </Stack>
  );
}

export default memo(ScopeBadges);