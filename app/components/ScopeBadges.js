import { memo, useMemo } from 'react';
import { Avatar, Stack, Tooltip } from '@mui/material';

function ScopeBadges({ scopes, r }){
  const p = useMemo(() => (scopes.includes('profile') ? 'lightblue' : 'grey'), [scopes]);
  const l = useMemo(() => (scopes.includes('locks') ? 'hotpink' : 'grey'), [scopes]);
  const k = useMemo(() => (scopes.includes('keyholder') ? 'violet' : 'grey'), [scopes]);
  const ps = useMemo(() => (scopes.includes('profile') ? (r ? 'required' : 'granted') : (r ? 'optional' : 'missing')), [scopes, r]);
  const ls = useMemo(() => (scopes.includes('locks') ? (r ? 'required' : 'granted') : (r ? 'optional' : 'missing')), [scopes, r]);
  const ks = useMemo(() => (scopes.includes('keyholder') ? (r ? 'required' : 'granted') : (r ? 'optional' : 'missing')), [scopes, r]);
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={`Your Identity (profile): ${ps}`} arrow placement="bottom-end">
        <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: p }} >P</Avatar>
      </Tooltip>
      <Tooltip title={`Your Locks (locks): ${ls}`} arrow placement="bottom-end">
        <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: l }} >L</Avatar>
      </Tooltip>
      <Tooltip title={`Your Keyholding (keyholder): ${ks}`} arrow placement="bottom-end">
        <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: k }} >K</Avatar>
      </Tooltip>
    </Stack>
  );
}

export default memo(ScopeBadges);