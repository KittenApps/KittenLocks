import { Typography, Avatar, Paper, Link } from '@mui/material';

export default function Home(){
  return (
    <Paper elevation={6} sx={{ p: 2, backgroundColor: '#1b192a' }} >
      <h2>Welcome to KittenLocks!</h2>
      <p>You will find exactly no introduction here for the moment! 😸</p>
      <Avatar src="/appicon.png" sx={{ width: 192, height: 192, ml: 15 }} />
      <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>illustration PNG Designed By 588ku from <Link href="https://pngtree.com" target="_blank" rel="noreferrer">Pngtree.com</Link></Typography>
    </Paper>
  );
};