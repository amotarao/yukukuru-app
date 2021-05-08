import { FirestoreDateLike, WatchData, RecordData, RecordUserData } from '@yukukuru/types';
import * as _ from 'lodash';
import { firestore } from '../../modules/firebase';
import { addRecord } from '../../modules/firestore/records/addRecord';
import { addRecords } from '../../modules/firestore/records/addRecords';
import { existsRecords } from '../../modules/firestore/records/legacy';
import { getToken, setTokenInvalid } from '../../modules/firestore/tokens';
import { setTwUsers } from '../../modules/firestore/twUsers';
import { getTwUser } from '../../modules/firestore/twUsers/getTwUser';
import { getUsersLookup } from '../../modules/twitter';
import { getClient } from '../../modules/twitter/client';
import { checkInvalidToken, checkNoUserMatches } from '../../modules/twitter/error';
import { FirestoreOnCreateHandler } from '../../types/functions';
import { mergeWatches } from '../../utils/followers/watches';
import { log, errorLog } from '../../utils/log';

const emptyRecord: RecordData<FirestoreDateLike> = {
  type: 'kuru',
  user: {
    id: 'EMPTY',
    maybeDeletedOrSuspended: true,
  },
  durationStart: new Date(2000, 0),
  durationEnd: new Date(2000, 0),
};

export const onCreateWatchHandler: FirestoreOnCreateHandler = async (snapshot, context) => {
  const data = snapshot.data() as WatchData;
  const uid = context.params.userId as string;

  log('onCreateWatch', '', { queueId: snapshot.id, uid });

  // 終了している watch でなければ終了
  if (data.ended === false) {
    log('onCreateWatch', '', { uid, type: 'noEnded' });
    return;
  }

  const endedQuery = await firestore
    .collection('users')
    .doc(uid)
    .collection('watches')
    .where('ended', '==', true)
    .orderBy('getEndDate', 'desc')
    .startAfter(data.getEndDate)
    .limit(2)
    .get();

  // 比較できるデータがない
  if (endedQuery.empty) {
    log('onCreateWatch', '', { uid, type: 'noPreviousWatch' });
    return;
  }
  const startDates = endedQuery.docs.map((snap) => (snap.data() as WatchData).getStartDate);
  const endDates = endedQuery.docs.map((snap) => (snap.data() as WatchData).getEndDate);

  const durationStart = startDates[0];
  const durationEnd = data.getEndDate;

  const startAfter: FirestoreDateLike = endedQuery.size === 2 ? endDates[1] : new Date(2000, 0);
  const targetQuery = await firestore
    .collection('users')
    .doc(uid)
    .collection('watches')
    .orderBy('getEndDate')
    .startAfter(startAfter)
    .get();

  const watchDocs = targetQuery.docs.map((doc) => {
    return {
      id: doc.id,
      data: doc.data() as WatchData,
    };
  });
  const [oldWatch, newWatch] = mergeWatches(watchDocs, true);

  const oldFollowers = oldWatch.watch.followers;
  const newFollowers = newWatch.watch.followers;

  const yuku = _.difference(oldFollowers, newFollowers);
  const kuru = _.difference(newFollowers, oldFollowers);

  // 差分なし
  if (!kuru.length && !yuku.length) {
    const exists = await existsRecords(uid);

    if (!exists) {
      await addRecord({ uid, data: emptyRecord });
    }

    log('onCreateWatch', '', { uid, type: 'noDiffs' });
    return;
  }

  const token = await getToken(uid);
  if (!token) {
    errorLog('onCreateWatch', '', { uid, type: 'invalidToken' });
  }

  const client = token
    ? getClient({
        access_token_key: token.twitterAccessToken,
        access_token_secret: token.twitterAccessTokenSecret,
      })
    : getClient();
  const result = await getUsersLookup(client, { usersId: [...kuru, ...yuku] });

  if ('errors' in result) {
    result.errors.forEach((error) => {
      if (!checkNoUserMatches([error])) {
        errorLog('onCreateWatch', '', { uid, error, type: 'TwitterError' });
      }
    });

    if (checkInvalidToken(result.errors)) {
      await setTokenInvalid(uid);
    }
  }

  const twUsers = 'errors' in result ? [] : result.response;

  const usersFromTw = twUsers.map((user) => {
    const convertedUser: RecordUserData = {
      id: user.id_str,
      screenName: user.screen_name,
      displayName: user.name,
      photoUrl: user.profile_image_url_https,
      maybeDeletedOrSuspended: false,
    };
    return convertedUser;
  });

  const findUser = async (userId: string): Promise<RecordUserData> => {
    const userFromTw = usersFromTw.find((e) => e.id === userId);
    if (userFromTw) {
      return userFromTw;
    }

    const user = await getTwUser(userId);
    if (user === null) {
      const item: RecordUserData = {
        id: userId,
        maybeDeletedOrSuspended: true,
      };
      return item;
    }

    const item: RecordUserData = {
      id: user.data.id,
      screenName: user.data.screenName,
      displayName: user.data.name,
      photoUrl: user.data.photoUrl,
      maybeDeletedOrSuspended: true,
    };
    return item;
  };

  const yukuRecords = yuku.map(
    async (id): Promise<RecordData> => {
      const user = await findUser(id);
      return {
        type: 'yuku',
        user,
        durationStart,
        durationEnd,
      };
    }
  );
  const kuruRecords = kuru.map(
    async (id): Promise<RecordData> => {
      const user = await findUser(id);
      return {
        type: 'kuru',
        user,
        durationStart,
        durationEnd,
      };
    }
  );
  const records = await Promise.all([...kuruRecords, ...yukuRecords]);

  const addRecordsPromise = addRecords({ uid, items: records });
  const setTwUsersPromise = setTwUsers(twUsers);

  await Promise.all([addRecordsPromise, setTwUsersPromise]);

  log('onCreateWatch', '', { uid, type: 'success', records });
};
