import { TokenData } from '@yukukuru/types';
import { firestore } from '../../firebase';

const collection = firestore.collection('tokens');

export const setTokenInvalid = async (userId: string): Promise<void> => {
  const data: Pick<TokenData, 'twitterAccessToken' | 'twitterAccessTokenSecret'> = {
    twitterAccessToken: '',
    twitterAccessTokenSecret: '',
  };
  await collection.doc(userId).update(data);
};

export const getToken = async (userId: string): Promise<TokenData | null> => {
  const ref = collection.doc(userId);
  const doc = await ref.get();
  if (!doc.exists) {
    return null;
  }

  const { twitterAccessToken, twitterAccessTokenSecret, twitterId } = doc.data() as TokenData;
  if (!twitterAccessToken || !twitterAccessTokenSecret || !twitterId) {
    return null;
  }
  return { twitterAccessToken, twitterAccessTokenSecret, twitterId };
};
