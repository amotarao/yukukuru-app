import { UserData } from '@yukukuru/types';
import { firestore } from '../../firebase';

const collection = firestore.collection('users');

/**
 * ユーザーの validToken を true にする
 */
export const updateUserValidToken = async (id: string): Promise<void> => {
  const data: Pick<UserData, 'validToken'> = { validToken: true };
  await collection.doc(id).update(data);
};

/**
 * ユーザーの validToken を false にする
 */
export const updateUserInvalidToken = async (id: string): Promise<void> => {
  const data: Pick<UserData, 'validToken'> = { validToken: false };
  await collection.doc(id).update(data);
};
