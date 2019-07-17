import * as _ from 'lodash';
import * as Twitter from 'twitter';
import { twitterClientErrorHandler, TwitterClientErrorData } from '../utils/error';
import { checkRateLimitExceeded } from './firestore';

export interface GetFollowersListProps {
  userId: string;
  cursor?: string;
  count?: number;
}

export interface GetFollowersListResponseData {
  users: { id_str: string }[];
  next_cursor_str: string;
}

/**
 * userId のフォロワーリストを取得
 * 200人まで 取得可能
 * 15分につき 15回取得可能
 */
export const getFollowersListSingle = (
  client: Twitter,
  { userId, cursor = '-1', count = 200 }: GetFollowersListProps
): Promise<{ response: GetFollowersListResponseData } | { errors: TwitterClientErrorData[] }> => {
  return client
    .get('followers/list', {
      user_id: userId,
      cursor,
      count,
      skip_status: true,
      include_user_entities: false,
    })
    .then((response) => {
      return { response: response as GetFollowersListResponseData };
    })
    .catch(twitterClientErrorHandler);
};

/**
 * userId のフォロワーリストを取得
 * 15分につき 3,000人まで 取得可能
 */
export const getFollowersList = async (
  client: Twitter,
  { userId, cursor = '-1' }: GetFollowersListProps
): Promise<{ response: GetFollowersListResponseData } | { errors: TwitterClientErrorData[] }> => {
  const users: { id_str: string }[] = [];
  let nextCursor = cursor;
  let count = 0;

  while (count < 15) {
    const obj: GetFollowersListProps = {
      userId,
      cursor: nextCursor,
    };
    const result = await getFollowersListSingle(client, obj);
    if ('errors' in result) {
      if (checkRateLimitExceeded(result.errors)) {
        console.error({ summary: 'rateLimitExceeded', userId, count });
        break;
      }
      return result;
    }
    users.push(...result.response.users);
    nextCursor = result.response.next_cursor_str;
    if (result.response.next_cursor_str === '0') {
      break;
    }
    count++;
  }

  const response: GetFollowersListResponseData = {
    users,
    next_cursor_str: nextCursor,
  };

  return { response };
};

export interface GetUsersLookupProps {
  usersId: string[];
}

export interface GetUsersLookupResponseData {
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
}

/**
 * ユーザー情報を取得
 * 100人まで 取得可能
 * 15分につき 900回 実行可能
 */
export const getUsersLookupSingle = (
  client: Twitter,
  { usersId }: GetUsersLookupProps
): Promise<{ response: GetUsersLookupResponseData[] } | { errors: TwitterClientErrorData[] }> => {
  return client
    .get('users/lookup', {
      user_id: usersId.join(','),
    })
    .then((response) => {
      return { response: response as GetUsersLookupResponseData[] };
    })
    .catch(twitterClientErrorHandler);
};

/**
 * ユーザー情報を取得
 * 15分につき 90,000人まで 取得可能
 */
export const getUsersLookup = async (
  client: Twitter,
  { usersId }: GetUsersLookupProps
): Promise<{ response: GetUsersLookupResponseData[] } | { errors: TwitterClientErrorData[] }> => {
  const users: GetUsersLookupResponseData[] = [];
  const errors: TwitterClientErrorData[] = [];

  const lookup = _.chunk(_.uniq(usersId), 100).map(async (usersId) => {
    const result = await getUsersLookupSingle(client, { usersId });

    if ('errors' in result) {
      errors.push(...result.errors);
      return;
    }

    result.response.forEach(({ id_str, name, screen_name, profile_image_url_https }) => {
      const data: GetUsersLookupResponseData = {
        id_str,
        name,
        screen_name,
        profile_image_url_https,
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