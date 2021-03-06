import { RecordUserData, RecordData, FirestoreDateLike, CheckIntegrityMessage } from '@yukukuru/types';
import * as _ from 'lodash';
import { addRecords } from '../modules/firestore/records/add';
import { getRecords } from '../modules/firestore/records/get';
import { removeRecords } from '../modules/firestore/records/remove';
import { updateRecordsStart } from '../modules/firestore/records/update';
import { getTwUsers } from '../modules/firestore/twUsers';
import { updateUserCheckIntegrity } from '../modules/firestore/users/state';
import { getWatches } from '../modules/firestore/watches/getWatches';
import { removeWatches } from '../modules/firestore/watches/removeWatches';
import { PubSubOnPublishHandler } from '../types/functions';
import { getDiffFollowers, DiffWithId, getDiffWithIdRecords, checkSameEndDiff } from '../utils/followers/diff';
import { mergeWatches } from '../utils/followers/watches';
import { log, errorLog } from '../utils/log';

export const runCheckIntegrityHandler: PubSubOnPublishHandler = async (message, context) => {
  const { uid, publishedAt } = message.json as CheckIntegrityMessage['data'];
  const now = new Date(context.timestamp);

  // 10秒以内の実行に限る
  if (now.getTime() - new Date(publishedAt).getTime() > 1000 * 10) {
    console.error(`❗️[Error]: Failed to run functions: published more than 10 seconds ago.`);
    return;
  }

  console.log(`⚙️ Starting check integrity for [${uid}].`);

  const watches = mergeWatches(await getWatches({ uid, count: 80 }), true, 10);

  if (watches.length < 5) {
    await updateUserCheckIntegrity(uid, now);
    return;
  }

  // 今回比較する watches 以外を取り除く
  watches.splice(watches.length - 3, watches.length);
  // 今回比較する watches のうち、最古のものの取得開始時刻
  const firstDate = watches[0].watch.getEndDate.toDate();
  // 今回比較する watches のうち、最新のものの取得開始時刻
  const lastDate = watches[watches.length - 1].watch.getEndDate.toDate();
  const records = await getRecords(uid, firstDate, lastDate);

  const currentDiffs = getDiffFollowers(watches.map(({ watch }) => watch));
  const currentDiffsWithId: DiffWithId[] = currentDiffs.map((diff) => ({ id: '', diff }));

  const firestoreDiffsWithId: DiffWithId[] = records.map(({ id, data: record }) => ({
    id,
    diff: {
      type: record.type,
      twitterId: record.user.id,
      durationStart: record.durationStart.toDate(),
      durationEnd: record.durationEnd.toDate(),
    },
  }));

  // 存在すべきなのに存在しない差分
  const notExistsDiffs = getDiffWithIdRecords(currentDiffsWithId, firestoreDiffsWithId);
  // 存在すべきではないが何故か存在する差分
  const unknownDiffs = getDiffWithIdRecords(firestoreDiffsWithId, currentDiffsWithId);

  // 存在しないドキュメントは追加する
  if (notExistsDiffs.length !== 0) {
    const twUsers = await getTwUsers(notExistsDiffs.map((diff) => diff.diff.twitterId));
    const items = notExistsDiffs.map(
      ({ diff }): RecordData<FirestoreDateLike> => {
        const twUser = twUsers.find((twUser) => twUser.id === diff.twitterId) || null;
        const userData: RecordUserData =
          twUser === null
            ? {
                id: diff.twitterId,
                maybeDeletedOrSuspended: true,
              }
            : {
                id: diff.twitterId,
                screenName: twUser.screenName,
                displayName: twUser.name,
                photoUrl: twUser.photoUrl,
                maybeDeletedOrSuspended: false,
              };
        return {
          type: diff.type,
          user: userData,
          durationStart: diff.durationStart,
          durationEnd: diff.durationEnd,
        };
      }
    );
    await addRecords(uid, items);
  }

  // 存在しないドキュメントがある場合は追加する
  if (notExistsDiffs.length !== 0 && unknownDiffs.length === 0) {
    log('onPublishCheckIntegrity', 'checkIntegrity', { type: 'hasNotExistsDiffs', uid, notExistsDiffs });
  }

  // 得体のしれないドキュメントがある場合はエラーを出す
  else if (notExistsDiffs.length === 0 && unknownDiffs.length !== 0) {
    const removeRecordIds = _.flatten(unknownDiffs.map(({ id }) => id));
    await removeRecords(uid, removeRecordIds);

    log('onPublishCheckIntegrity', 'checkIntegrity', { type: 'hasUnknownDiffs', uid, unknownDiffs, removeRecordIds });
  }

  // 何も変化がない場合、そのまま削除する
  else if (notExistsDiffs.length === 0 && unknownDiffs.length === 0) {
    const removeIds = _.flatten(watches.map(({ ids }) => ids).slice(0, watches.length - 1));
    await removeWatches({ uid, removeIds });

    log('onPublishCheckIntegrity', 'checkIntegrity', { type: 'correctRecords', uid, removeIds });
  }

  // durationStart だけ異なるドキュメントがある場合は、アップデートする
  else if (checkSameEndDiff(notExistsDiffs, unknownDiffs)) {
    const starts = _.sortBy(notExistsDiffs, ({ diff: { type, twitterId, durationEnd } }) =>
      JSON.stringify({ type, twitterId, d: durationEnd.getTime() })
    );
    const targets = _.sortBy(unknownDiffs, ({ diff: { type, twitterId, durationEnd } }) =>
      JSON.stringify({ type, twitterId, d: durationEnd.getTime() })
    );

    const items = targets.map((target, i) => {
      return {
        id: target.id,
        start: starts[i].diff.durationStart,
      };
    });

    await updateRecordsStart(uid, items);
    log('onPublishCheckIntegrity', 'checkIntegrity', { type: 'sameEnd', uid, notExistsDiffs, unknownDiffs, items });
  }

  // 想定されていない処理
  else {
    errorLog('onPublishCheckIntegrity', 'checkIntegrity', {
      type: 'checkIntegrity: ERROR',
      uid,
      notExistsDiffs,
      unknownDiffs,
    });
  }

  await updateUserCheckIntegrity(uid, now);

  console.log(`✔️ Completed check integrity for [${uid}].`);
};
