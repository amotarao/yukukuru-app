import React, { useEffect, useState } from 'react';

const fallbackImage = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png';

export type ProfileImageProps = React.HTMLProps<HTMLImageElement>;

export const ProfileImage: React.FC<ProfileImageProps> = ({ src, ...props }) => {
  const [stateSrc, setStateSrc] = useState<ProfileImageProps['src']>(src);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (stateSrc !== src) {
      setStateSrc(src);
      setError(false);
    }
  }, [stateSrc, src]);

  const onError = () => {
    setError(true);
  };

  return <img {...props} src={!error ? stateSrc : fallbackImage} crossOrigin="anonymous" onError={onError} />;
};
