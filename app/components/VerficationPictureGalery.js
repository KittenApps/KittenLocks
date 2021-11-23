import { useEffect, useState } from 'react';
import { ImageList, ImageListItem, ImageListItemBar, Skeleton, Typography } from '@mui/material';

export default function VerficationPictureGalery(props){
  const [pics, setPics] = useState(null);
  useEffect(() => {
    if (props.data){
      Promise.all(props.data.map(e => fetch(`https://api.chaster.app/files/${e.imageKey}`).then(d => d.json())
                                      .then(d => ({ src: d.url, title: new Date(e.submittedAt) }))))
      .then(d => d.sort((a, b) => a.title - b.title)).then(d => setPics(d));
    }
  }, [props.data]);

  if (!props.data) return <p>No verifications pictures found!</p>;
  if (!pics) return <Skeleton variant="rectangular" width="100%" height={300} />;
  if (pics.length === 0) return (
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
      It looks like this lock doesn't have any verification pictures yet :(
    </Typography>
  );

  return (
    <ImageList variant="masonry" cols={3} gap={8}>
      {pics.map(img => (
        <ImageListItem key={img.title.toString()}>
          <img src={img.src} alt={img.title} loading="lazy" />
          <ImageListItemBar title={img.title.toLocaleString()} />
        </ImageListItem>
      ))}
    </ImageList>
  );
}