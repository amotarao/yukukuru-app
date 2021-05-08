import { Timestamp } from '@firebase/firestore-types';
import { FirestoreDateLike } from '../firestore';

export interface UserData<T extends FirestoreDateLike = Timestamp> {
  /** 有効かどうか */
  active: boolean;

  /** token が有効かどうか */
  validToken: boolean;

  /** フォロワー一覧取得 最終実行日時 */
  lastUpdated: T;

  /** フォロワー情報取得 最終実行日時 */
  lastUpdatedTwUsers: T;

  /** 整合性チェック 最終実行日時 */
  lastUpdatedCheckIntegrity: T;

  /** Twitter情報 最終実行日時 */
  lastUpdatedUserTwitterInfo: T;

  /** フォロワー一覧取得 state cursor */
  nextCursor: string;

  /** フォロワー一覧取得 state doc-id */
  currentWatchesId: string;

  /** フォロワー一覧取得 state 途中かどうか */
  pausedGetFollower: boolean;

  /** グループ番号 0-14 のいずれか */
  group: number;

  /** Twitter情報 */
  twitter: {
    /** Twitter UID (ユニークな数字のID) */
    id: string;

    /** Twitter ID (@から始まるID) */
    screenName: string;

    /** 名前 (プロフィールの名前) */
    name: string;

    /** プロフィール画像の URL */
    photoUrl: string;

    /** フォロワー数 */
    followersCount: number;

    /** 認証済みユーザーかどうか */
    verified: boolean;
  };
}
