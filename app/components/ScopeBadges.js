import { Avatar, Stack } from '@mui/material';

export default function ScopeBadges(props){
  const p = props.scopes.includes('profile') ? 'lightblue' : 'grey';
  const l = props.scopes.includes('locks') ? 'hotpink' : 'grey';
  const k = props.scopes.includes('keyholder') ? 'violet' : 'grey';
  return (
    <Stack direction="row" spacing={0.5}>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: p }} >P</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: l }} >L</Avatar>
      <Avatar sx={{ width: 16, height: 16, fontSize: 'inherit', bgcolor: k }} >K</Avatar>
    </Stack>
  );
}