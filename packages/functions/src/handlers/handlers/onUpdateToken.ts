import { TokenData } from '@yukukuru/types';
import { setUserToActive } from '../../modules/firestore/users/active';
import { updateUserInvalidToken, updateUserValidToken } from '../../modules/firestore/users/validToken';
import { FirestoreOnUpdateHandler } from '../../types/functions';

export const onUpdateTokenHandler: FirestoreOnUpdateHandler = async ({ after }) => {
  const uid = after.id;

  const { twitterAccessToken, twitterAccessTokenSecret, twitterId } = after.data() as TokenData;
  const invalid = !twitterAccessToken || !twitterAccessTokenSecret || !twitterId;

  if (invalid) {
    await updateUserInvalidToken(uid);
  } else {
    await updateUserValidToken(uid);

    // レガシー対応
    // validToken を active で管理していた時期の名残
    await setUserToActive(uid);
  }
};
