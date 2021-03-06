import * as _ from 'lodash';
import * as Twitter from 'twitter';
import { TwitterUserObject } from '..';
import { TwitterClientError, twitterClientErrorHandler } from '../error';

export type TwitterGetUsersLookupParameters = {
  usersId: string[];
};

/**
 * ユーザー情報を取得
 * 100人まで 取得可能
 * 15分につき 300回 実行可能
 */
const getUsersLookupSingle = (
  client: Twitter,
  { usersId }: TwitterGetUsersLookupParameters
): Promise<{ response: TwitterUserObject[] } | { errors: TwitterClientError[] }> => {
  return client
    .get('users/lookup', {
      user_id: usersId.join(','),
    })
    .then((response) => {
      return { response: response as TwitterUserObject[] };
    })
    .catch(twitterClientErrorHandler);
};

/**
 * ユーザー情報を取得
 * 15分につき 30,000人まで 取得可能
 */
export const getUsersLookup = async (
  client: Twitter,
  { usersId }: TwitterGetUsersLookupParameters
): Promise<{ response: TwitterUserObject[] } | { errors: TwitterClientError[] }> => {
  const users: TwitterUserObject[] = [];
  const errors: TwitterClientError[] = [];

  const lookup = _.chunk(_.uniq(usersId), 100).map(async (usersId) => {
    const result = await getUsersLookupSingle(client, { usersId });

    if ('errors' in result) {
      errors.push(...result.errors);
      return;
    }

    result.response.forEach((res) => {
      const { id_str, screen_name, name, profile_image_url_https, followers_count, verified } = res;
      const data: TwitterUserObject = {
        id_str,
        screen_name,
        name,
        profile_image_url_https,
        followers_count,
        verified,
      };
      users.push(data);
    });
    return;
  });

  await Promise.all(lookup);

  if (users.length || !errors.length) {
    return { response: users };
  }

  return { errors };
};
