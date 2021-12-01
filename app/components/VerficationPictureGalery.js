import { useEffect, useState } from 'react';
import { IconButton, ImageListItem, ImageListItemBar, Modal, Skeleton, Typography } from '@mui/material';
import Masonry from '@mui/lab/Masonry';
import IosShareIcon from '@mui/icons-material/IosShare';

export default function VerficationPictureGalery({ data }){
  const [pics, setPics] = useState(null);
  useEffect(() => {
    if (data){
      Promise.all(data.map(e => fetch(`https://api.chaster.app/files/${e.imageKey}`).then(d => d.json())
                                .then(d => ({ src: d.url, code: e.verificationCode, title: new Date(e.submittedAt) }))))
      .then(d => d.sort((a, b) => a.title - b.title)).then(d => setPics(d));
    }
  }, [data]);

  const [selected, setSelected] = useState(null);
  const handleClick = img => () => setSelected(img);
  const handleClose = () => setSelected(null);
  const handleShare = url => () => navigator.share({ url });

  if (!data) return <p>No verifications pictures found!</p>;
  if (!pics) return <Skeleton variant="rectangular" width="100%" height={300}/>;
  if (pics.length === 0) return (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      It looks like this lock doesn't have any verification pictures yet :(
    </Typography>
  );

  return (
    <>
      <Masonry columns={{ xs: 2, sm: 3, lg: 4 }} spacing={1}>
        {pics.map((img, i) => (
          <ImageListItem style={{ minHeight: 48, cursor: 'pointer' }} onClick={handleClick(img)} key={img.title.toString()}>
            <img src={img.src} alt={img.title.toLocaleString()}/>
            <ImageListItemBar title={`${img.title.toLocaleString()} (${img.code}) #${i + 1}`}/>
          </ImageListItem>
        ))}
      </Masonry>
      <Modal open={Boolean(selected)} sx={{ top: '10%', left: '10%', right: '10%', bottom: '10%', outline: 'none' }} onClose={handleClose} disablePortal BackdropProps={{ sx: { backgroundColor: 'rgba(0, 0, 0, 0.75)' } }}>
        <div>
          <img src={selected?.src} alt={selected?.title.toLocaleString()} style={{ maxWidth: '100%', maxHeight: '100%', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2),0px 24px 38px 3px rgba(0,0,0,0.14),0px 9px 46px 8px rgba(0,0,0,0.12)', outline: 'none' }}/>
          <h3 style={{ position: 'absolute', bottom: -52, width: '100%', textAlign: 'center' }}>
            {`${selected?.title.toLocaleString()} (${selected?.code})`}
            { navigator.share && <IconButton size="small" aria-label="share" onClick={handleShare(selected?.src)} sx={{ pt: 0 }} component="span"><IosShareIcon/></IconButton>}
          </h3>
        </div>
      </Modal>
    </>
  );
}