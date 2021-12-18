import { memo, useState } from 'react';
import { IconButton, ImageListItem, ImageListItemBar, Modal, Typography } from '@mui/material';
import { Masonry } from '@mui/lab';
import { IosShare } from '@mui/icons-material';

function VerificationPictureGallery({ history }){
  const [selected, setSelected] = useState(null);
  const handleClick = img => () => setSelected(img);
  const handleClose = () => setSelected(null);
  const handleShare = url => () => navigator.share({ url });

  if (history.length === 0) return (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      It looks like this lock doesn't have any verification pictures yet :(
    </Typography>
  );

  return (
    <>
      <Masonry columns={{ xs: 2, sm: 3, lg: 4 }} spacing={1}>
        {history.map((img, i) => (
          <ImageListItem style={{ minHeight: 48, cursor: 'pointer' }} onClick={handleClick(img)} key={img.imageKey}>
            <img src={img.image.url} alt={img.submittedAt.toLocaleString()}/>
            <ImageListItemBar title={`${img.submittedAt.toLocaleString()} (${img.verificationCode}) #${i + 1}`}/>
          </ImageListItem>
        ))}
      </Masonry>
      <Modal open={Boolean(selected)} sx={{ top: '10%', left: '10%', right: '10%', bottom: '10%', outline: 'none' }} onClose={handleClose} disablePortal BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}>
        <div>
          <img src={selected?.image.url} alt={selected?.submittedAt.toLocaleString()} style={{ maxWidth: '100%', maxHeight: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)', outline: 'none' }}/>
          <h3 style={{ position: 'absolute', bottom: -52, width: '100%', textAlign: 'center' }}>
            {`${selected?.submittedAt.toLocaleString()} (${selected?.verificationCode})`}
            { navigator.share && <IconButton size="small" aria-label="share" onClick={handleShare(selected?.image.url)} sx={{ pt: 0 }} component="span"><IosShare/></IconButton>}
          </h3>
        </div>
      </Modal>
    </>
  );
}

export default memo(VerificationPictureGallery);