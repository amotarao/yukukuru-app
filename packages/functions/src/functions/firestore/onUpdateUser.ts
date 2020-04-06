import * as functions from 'firebase-functions';
import * as Twitter from 'twitter';
import * as _ from 'lodash';
import { env } from '../../utils/env';
import {
  checkInvalidToken,
  setTokenInvalid,
  getToken,
  setRecord,
  existsRecords,
  getTwUsers,
  setTwUsers,
} from '../../utils/firestore';
import { UserData, UserWatchData, UserRecordUserItemData, UserRecordData } from '../../utils/interfaces';
import { getUsersLookup } from '../../utils/twitter';

export default async ({ after, before }: functions.Change<FirebaseFirestore.DocumentSnapshot>) => {
  const afterData = after.data() as UserData;
  const beforeData = before.data() as UserData;
  const uid = after.id;

  if (afterData.nextCursor !== '-1' || afterData.newUser) {
    // フォロワー取得途中 か 新規ユーザー
    console.log('afterData.nextCursor !== "-1" || afterData.newUser');
    return;
  }

  if (!afterData.lastUpdated || !beforeData.lastUpdated) {
    // lastUpdated が存在しない
    console.log('!afterData.lastUpdated || !beforeData.lastUpdated');
    return;
  }

  const afterLastUpdated = afterData.lastUpdated.toDate().toString();
  const beforeLastUpdated = beforeData.lastUpdated.toDate().toString();
  if (afterLastUpdated === beforeLastUpdated) {
    // フォロワー取得更新なし
    console.log('afterLastUpdated === beforeLastUpdated');
    return;
  }

  if (!afterData.lastUpdatedTwUsers || !beforeData.lastUpdatedTwUsers) {
    // lastUpdatedTwUsers が存在しない
    console.log('!afterData.lastUpdatedTwUsers || !beforeData.lastUpdatedTwUsers');
    return;
  }

  const afterLastUpdatedTwUsers = afterData.lastUpdatedTwUsers.toDate().toString();
  const beforeLastUpdatedTwUsers = beforeData.lastUpdatedTwUsers.toDate().toString();
  if (afterLastUpdatedTwUsers !== beforeLastUpdatedTwUsers) {
    // TwUsers のみの更新なので、アップデートされていない
    console.log('afterLastUpdatedTwUsers !== beforeLastUpdatedTwUsers');
    return;
  }

  const endedQuery = await after.ref
    .collection('watches')
    .where('ended', '==', true)
    .orderBy('getEndDate', 'desc')
    .limit(3)
    .get();
  if (endedQuery.size < 2) {
    console.log('endedQuery.size < 2');
    return;
  }
  const endDates = endedQuery.docs.map((snap) => (snap.data() as UserWatchData).getEndDate);

  const startAfter: FirebaseFirestore.Timestamp | Date = endedQuery.size === 3 ? endDates[2] : new Date('2000/1/1');
  const targetQuery = await after.ref.collection('watches').orderBy('getEndDate').startAfter(startAfter).get();

  const oldFollowers: string[] = [];
  const newFollowers: string[] = [];

  targetQuery.docs.map((doc) => {
    const { followers, getEndDate } = doc.data() as UserWatchData;
    if (getEndDate.seconds <= endDates[1].seconds) {
      oldFollowers.push(...followers);
      return;
    }
    newFollowers.push(...followers);
    return;
  });

  const came = _.difference(newFollowers, oldFollowers);
  const left = _.difference(oldFollowers, newFollowers);

  if (!came.length && !left.length) {
    // 差分なし

    const exists = await existsRecords(uid);

    if (!exists) {
      const data: UserRecordData = {
        cameUsers: [],
        leftUsers: [],
        durationStart: endDates[1],
        durationEnd: endDates[0],
      };
      await setRecord(uid, data);
    }

    return;
  }

  const token = await getToken(uid);
  if (!token) {
    console.log(uid, 'no-token');
    await setTokenInvalid(uid);
    return;
  }
  const { twitterAccessToken, twitterAccessTokenSecret } = token;

  const client = new Twitter({
    consumer_key: env.twitter_api_key,
    consumer_secret: env.twitter_api_secret_key,
    access_token_key: twitterAccessToken,
    access_token_secret: twitterAccessTokenSecret,
  });

  const result = await getUsersLookup(client, { usersId: [...came, ...left] });

  if ('errors' in result) {
    console.error(uid, result);
    if (checkInvalidToken(result.errors)) {
      await setTokenInvalid(uid);
    }
  }

  const lookupedUsers = 'errors' in result ? [] : result.response;

  const users = lookupedUsers.map(({ id_str, name, screen_name, profile_image_url_https }) => {
    const convertedUser: UserRecordUserItemData = {
      id: id_str,
      name: name,
      screenName: screen_name,
      photoUrl: profile_image_url_https,
      notFounded: false,
    };
    return convertedUser;
  });

  const findUser = async (userId: string): Promise<UserRecordUserItemData> => {
    const obj = users.find((e) => e.id === userId);
    if (obj) {
      return obj;
    }

    const user = await getTwUsers([userId]);
    if (user.length === 0) {
      const item: UserRecordUserItemData = {
        id: userId,
        notFounded: true,
      };
      return item;
    }

    const item: UserRecordUserItemData = {
      ...user[0],
      notFounded: true,
    };
    return item;
  };

  const [cameUsers, leftUsers] = await Promise.all([Promise.all(came.map(findUser)), Promise.all(left.map(findUser))]);

  const data: UserRecordData = {
    cameUsers,
    leftUsers,
    durationStart: endDates[1],
    durationEnd: endDates[0],
  };
  const setRecordPromise = setRecord(uid, data);
  const setTwUsersPromise = setTwUsers(lookupedUsers);

  await Promise.all([setRecordPromise, setTwUsersPromise]);

  console.log(data);
};