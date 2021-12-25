import { memo, useCallback, useMemo, useState } from 'react';
import { ImageListItem, ImageListItemBar, Typography, useMediaQuery } from '@mui/material';
import { Masonry } from '@mui/lab';
import { IosShare } from '@mui/icons-material';
import ReactViewer from 'react-viewer';
import { ClassNames } from '@emotion/react';

const VerificationPicture = memo(({ img, setSelected }) => {
  const handleClick = useCallback(() => setSelected(img.i), [img, setSelected]);
  return (
    <ImageListItem style={{ minHeight: 48, cursor: 'pointer' }} onClick={handleClick}>
      <img src={img.src} alt={img.alt}/>
      <ImageListItemBar title={img.alt}/>
    </ImageListItem>
  );
});
VerificationPicture.displayName = 'VerificationPicture';

function VerificationPictureGallery({ history }){
  const isTinyScreen = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const [selected, setSelected] = useState(-1);
  const handleClose = useCallback(() => setSelected(-1), []);
  const imgs = useMemo(() => history.map((img, i) => ({ src: img.image.url, downloadUrl: img.image.url, alt: `${img.submittedAt.toLocaleString()} (${img.verificationCode}) #${i + 1}`, i, key: img.imageKey })), [history]);
  const extendToolbar = useCallback(dc => (navigator.share ? [...dc, { key: 'share', render: <IosShare sx={{ fontSize: 16 }}/>, onClick: i => navigator.share({ url: i.src }) }] : dc), []);

  if (imgs.length === 0) return (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      It looks like this lock doesn't have any verification pictures yet :(
    </Typography>
  );

  return (
    <>
      <Masonry columns={{ xs: 2, sm: 3, lg: 4 }} spacing={1}>
        { imgs.map(img => <VerificationPicture key={img.key} img={img} setSelected={setSelected}/>)}
      </Masonry>
      <ClassNames>
        {({ css }) => (
          <ReactViewer
            visible={selected >= 0}
            onClose={handleClose}
            zoomable={!isTinyScreen}
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
            className={css`
              & .react-viewer-mask {
                background-color: rgba(0, 0, 0, 0.75);
              }
              & .react-viewer-attribute {
                color: #ffffff;
                font-size: 20px;
                font-weight: 600;
              }
              & .react-viewer-toolbar {
                height: 36px;
              }
              & .react-viewer-toolbar li {
                width: 36px;
                height: 36px;
                border-radius: 36px;
                line-height: 36px;
              }
            `}
          />
        )}
      </ClassNames>
    </>
  );
}

export default memo(VerificationPictureGallery);