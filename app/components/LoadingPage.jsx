import { memo } from 'react';
import AppIcon from '../../assets/appicon.webp';

function LoadingPage(){
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'white', fontFamily: 'Roboto, Helvetica, Arial, sans-serif' }}>
      <h1>KittenLocks</h1>
      <img src={AppIcon} alt="KittenLocks icon" style={{ maxWidth: '100%', maxHeight: '70%' }}/>
      <h4>loading...</h4>
    </div>
  );
}

export default memo(LoadingPage);