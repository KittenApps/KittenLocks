import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ImageListItem, ImageListItemBar, Typography } from '@mui/material';
import { Masonry } from '@mui/lab';
import { IosShare } from '@mui/icons-material';
import { useQuery } from '@apollo/client';
import GetVerificationPictures from '../graphql/GetVerificationPicturesQuery.graphql';
import { useSnackbar } from 'notistack';
import ReactViewer from '@silizia/react-viewer';

const VerificationPicture = memo(({ img, setSelected }) => {
  const handleClick = useCallback(() => setSelected(img.i), [img, setSelected]);
  return (
    <ImageListItem style={{ minHeight: 80, cursor: 'pointer' }} onClick={handleClick}>
      <img src={img.src} alt="loading..." style={{ borderRadius: 8 }}/>
      <ImageListItemBar title={img.alt} style={{ borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}/>
    </ImageListItem>
  );
});
VerificationPicture.displayName = 'VerificationPicture';

function VerificationPictureGallery({ lockId }){
  const [selected, setSelected] = useState(-1);
  const handleClose = useCallback(() => setSelected(-1), []);
  const { enqueueSnackbar } = useSnackbar();
  const { data, error, loading } = useQuery(GetVerificationPictures, { variables: { lockId }, fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' });
  useEffect(() => {
    if (error){
      enqueueSnackbar(error.toString(), { variant: 'error' });
      console.error(error);
    }
  }, [error, enqueueSnackbar]);
  const imgs = useMemo(() => data?.verificationPictures.map((img, i) => ({ src: img.image?.url, downloadUrl: img.image?.url, alt: `${img.submittedAt.toLocaleString()} (${img.verificationCode}) #${i + 1}`, i })), [data]);
  const extendToolbar = useCallback(dc => (navigator.share ? [...dc, { key: 'share', render: <IosShare sx={{ fontSize: 16 }}/>, onClick: i => navigator.share({ url: i.src }) }] : dc), []);

  if (loading || error) return <Typography variant="caption" color="text.secondary">loading ...</Typography>;

  if (imgs.length === 0) return (
    <Typography variant="caption" color="text.secondary">
      It looks like this lock doesn't have any verification pictures yet :(
    </Typography>
  );

  return (
    <>
      <Masonry columns={{ xs: 2, sm: 3, lg: 4 }} spacing={1}>
        { imgs.map(img => <VerificationPicture key={img.src} img={img} setSelected={setSelected}/>)}
      </Masonry>
      <ReactViewer
        visible={selected >= 0}
        onClose={handleClose}
        images={imgs}
        activeIndex={selected}
        zIndex={1201}
        onMaskClick={handleClose}
        downloadable
        noImgDetails
        zoomSpeed={0.1}
        downloadInNewWindow
        showTotal={false}
        customToolbar={extendToolbar}
      />
    </>
  );
}

export default memo(VerificationPictureGallery);