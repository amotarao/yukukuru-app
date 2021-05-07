import { UpdateUserTwitterInfoMessage, UserData } from '@yukukuru/types';
import * as functions from 'firebase-functions';
import * as Twitter from 'twitter';
import { getToken } from '../../modules/firestore/tokens';
import { updateUserTwitterInfo } from '../../modules/firestore/users/state';
import { getVerifyCredentials } from '../../modules/twitter/verifyCredentials';
import { PubSubOnPublishHandler } from '../../types/functions';

type Props = UpdateUserTwitterInfoMessage['data'];

export const onPublishUpdateUserTwitterInfoHandler: PubSubOnPublishHandler = async (message, context) => {
  const { uid } = message.json as Props;
  const now = new Date(context.timestamp);

  console.log(`⚙️ Starting update user document twitter info for [${uid}].`);

  const token = await getToken(uid);

  if (token === null) {
    console.error(`❗️[Error]: Failed to get token of [${uid}]: Token is not exists.`);
    return;
  }
  console.log(`⏳ Got watches and token from Firestore.`);

  const client = new Twitter({
    consumer_key: functions.config().twitter.consumer_key as string,
    consumer_secret: functions.config().twitter.consumer_secret as string,
    access_token_key: token.twitterAccessToken,
    access_token_secret: token.twitterAccessTokenSecret,
  });
  const result = await getVerifyCredentials(client);

  if ('errors' in result) {
    console.error(`❗️[Error]: Failed to get user from Twitter of [${uid}].`, result.errors);
    return;
  }
  console.log(`⏳ Got user info from Twitter.`);

  const twitter: UserData['twitter'] = {
    id: result.response.id_str,
    screenName: result.response.screen_name,
    name: result.response.name,
    photoUrl: result.response.profile_image_url_https,
    followersCount: result.response.followers_count,
    verified: result.response.verified,
  };

  await updateUserTwitterInfo(uid, twitter, now);

  console.log(`⏳ Updated user document twitter info of [${uid}].`);

  console.log(`✔️ Completed update user document twitter info for [${uid}].`);
};
