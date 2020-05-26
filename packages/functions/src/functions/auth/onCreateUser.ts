import { admin } from '../../modules/firebase';
import { initializeUser } from '../../utils/firestore/users';

type Data = Parameters<typeof initializeUser>[1];

export const onCreateUserHandler = async (user: admin.auth.UserRecord) => {
  const { photoURL, displayName, uid } = user;
  const data: Data = {
    displayName: displayName || '',
    photoUrl: photoURL || '',
  };
  await initializeUser(uid, data);
};
