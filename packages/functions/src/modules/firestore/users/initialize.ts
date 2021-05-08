import { FirestoreDateLike, UserData } from '@yukukuru/types';
import { admin, firestore } from '../../firebase';
import { getGroupIndex } from '../../group';

const collection = firestore.collection('users');

/**
 * ユーザーを初期化
 */
export const initializeUser = async (id: string, twitter: UserData['twitter']): Promise<void> => {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const data: UserData<FirestoreDateLike> = {
    active: true,
    validToken: false,
    lastUpdated: now,
    lastUpdatedTwUsers: now,
    lastUpdatedCheckIntegrity: now,
    lastUpdatedUserTwitterInfo: now,
    nextCursor: '-1',
    currentWatchesId: '',
    pausedGetFollower: false,
    group: getGroupIndex(id),
    twitter,
  };
  await collection.doc(id).set(data, { merge: true });
};
