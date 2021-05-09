import { RecordData, UserData } from '@yukukuru/types';
import React, { useState, useEffect } from 'react';
import { useRecords } from '../../../hooks/records';
import * as gtag from '../../../libs/gtag';
import { LastUpdatedText } from '../../atoms/LastUpdatedText';
import { LoadingCircle } from '../../atoms/LoadingCircle';
import { ErrorWrapper } from '../../organisms/ErrorWrapper';
import { MyNav, NavType } from '../../organisms/MyNav';
import { SettingMenu } from '../../organisms/SettingMenu';
import { UserCard } from '../../organisms/UserCard';
import styles from './styles.module.scss';

export type MyPageProps = {
  isLoading: boolean;
  isNextLoading: boolean;
  items: RecordData[];
  hasNext: boolean;
  hasToken: boolean;
  lastRunnedGetFollowers: Date;
  user: Pick<UserData['twitter'], 'name' | 'screenName' | 'photoUrl'>;
  getNextRecords: ReturnType<typeof useRecords>[1]['getNextRecords'];
  signOut: () => void | Promise<void>;
};

/**
 * アイテムがないことを表示するコンポーネント
 */
const NoItem: React.FC = () => {
  return (
    <div className={styles.noticeWrapper}>
      <p className={styles.noticeText}>最初のデータ取得までしばらくお待ちください。</p>
      <p className={styles.noticeText}>
        現在、フォロワー数1万人以上のアカウントの
        <wbr />
        新規登録を停止しています。
        <wbr />
        (2021.5.8)
      </p>
    </div>
  );
};

/**
 * 表示するデータがないことを表示するコンポーネント
 */
const NoViewItem: React.FC<Pick<MyPageProps, 'lastRunnedGetFollowers'>> = ({ lastRunnedGetFollowers }) => {
  return (
    <div className={styles.noticeWrapper}>
      <p className={styles.noticeText}>
        データの取得は完了していますが、
        <wbr />
        今のところフォロワーの増減がありません。
      </p>
      <LastUpdatedText className={styles.noticeText} date={lastRunnedGetFollowers} />
    </div>
  );
};

/**
 * メインエリア
 */
const Home: React.FC<Pick<MyPageProps, 'items' | 'lastRunnedGetFollowers'>> = ({ items, lastRunnedGetFollowers }) => {
  if (items.length === 0) {
    // lastRunnedGetFollowers が 0 の場合、watches 取得処理が1回も完了していない
    if (lastRunnedGetFollowers.getTime() === 0) {
      return <NoItem />;
    }
    return <NoViewItem lastRunnedGetFollowers={lastRunnedGetFollowers} />;
  }

  let currentDate = '';

  return (
    <div className={styles.homeArea}>
      <nav className={styles.labelNav}>
        <ul>
          <li data-type="yuku">ゆくひと</li>
          <li data-type="kuru">くるひと</li>
        </ul>
      </nav>
      <div className={styles.noticeWrapper} style={{ marginTop: -70 }}>
        <LastUpdatedText className={styles.noticeText} date={lastRunnedGetFollowers} />
      </div>
      {items.map((item, itemIndex) => {
        const date = item.durationEnd.toDate();
        const dateText = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        const showDate = currentDate !== dateText;
        currentDate = dateText;

        return (
          <React.Fragment key={itemIndex}>
            {showDate && <h2 className={styles.recordHead}>{dateText}</h2>}
            <section className={styles.userSection} data-type={item.type}>
              <UserCard {...item} />
            </section>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/**
 * マイページ全体のコンポーネント
 */
export const MyPage: React.FC<MyPageProps> = ({
  isLoading,
  isNextLoading,
  items,
  hasNext,
  hasToken,
  lastRunnedGetFollowers,
  user,
  getNextRecords,
  signOut,
}) => {
  const [nav, setNav] = useState<NavType>('home');
  const [paging, setPaging] = useState<number>(1);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    document.documentElement.style.overflow = nav !== 'home' ? 'hidden' : '';
  }, [nav]);

  useEffect(() => {
    if (isLoading || isNextLoading) {
      return;
    }

    gtag.event({
      action: 'element_show',
      category: 'has_next',
      label: hasNext ? `has_next_p-${paging}` : `has_not_next_p-${paging}`,
      value: 100,
    });
  }, [isLoading, isNextLoading, hasNext, paging]);

  const getNext = () => {
    getNextRecords();
    gtag.event({
      action: 'button_click',
      category: 'click_next',
      label: `click_next_p-${paging}`,
      value: 100,
    });
    setPaging(paging + 1);
  };

  const superReload = () => {
    window.location.reload(true);
  };

  return (
    <div className={styles.wrapper}>
      <MyNav active={nav} userImageUrl={user.photoUrl} onChange={setNav} signOut={signOut} />
      {!isLoading && !hasToken && (
        <ErrorWrapper onClick={superReload}>
          <p>ログアウトし、再度ログインしてください。</p>
          <p>解消しない場合はこちらをタップしてください。</p>
        </ErrorWrapper>
      )}
      <main className={styles.main}>
        {isLoading ? (
          <LoadingCircle />
        ) : (
          <>
            <Home items={items} lastRunnedGetFollowers={lastRunnedGetFollowers} />
            {!isLoading && isNextLoading && <LoadingCircle />}
            {!isLoading && hasNext && (
              <button className={styles.getNextButton} disabled={isNextLoading} onClick={getNext}>
                続きを取得
              </button>
            )}
          </>
        )}
      </main>
      {nav === 'setting' && (
        <section className={styles.section}>
          <SettingMenu signOut={signOut} />
        </section>
      )}
    </div>
  );
};
