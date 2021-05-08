import { UserData } from '@yukukuru/types';
import { firestore } from '../../firebase';

const collection = firestore.collection('users');

/**
 * ユーザーの active を true にする
 */
export const setUserToActive = async (id: string): Promise<void> => {
  const data: Pick<UserData, 'active'> = { active: true };
  await collection.doc(id).update(data);
};

/**
 * ユーザーの active を false にする
 */
export const setUserToNotActive = async (id: string): Promise<void> => {
  const data: Pick<UserData, 'active'> = { active: false };
  await collection.doc(id).update(data);
};
