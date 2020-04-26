/** @jsx jsx */
import { jsx } from '@emotion/core';
import { RecordData } from '@yukukuru/types';
import React from 'react';
import { AuthStoreType } from '../../../store/auth';
import { RecordsStoreType } from '../../../store/database/records';
import MediaQuery from 'react-responsive';
import { TweetButton } from '../../organisms/TweetButton';
import { ThemeSwitchButtonContainer } from '../../organisms/ThemeSwitchButton';
import { UserCard } from '../../organisms/UserCard';
import { style } from './style';

export interface MyPageProps {
  isLoading: boolean;
  isNextLoading: boolean;
  items: RecordData[];
  hasItems: boolean;
  hasOnlyEmptyItems: boolean;
  hasNext: boolean;
  hasToken: boolean;
  getNextRecords: RecordsStoreType['getNextRecords'];
  signOut: AuthStoreType['signOut'];
}

/**
 * エラー表示をするコンポーネント
 */
const Error: React.FC<Pick<MyPageProps, 'hasToken'>> = ({ hasToken }) => {
  if (!hasToken) {
    return (
      <div css={style.errorWrapper}>
        <span style={{ whiteSpace: 'nowrap' }}>ログアウトし、再度ログインしてください。</span>
      </div>
    );
  }
  return null;
};

/**
 * アイテムがないことを表示するコンポーネント
 */
const NoItem: React.FC = () => {
  return (
    <div>
      <p
        style={{
          fontSize: '0.8em',
          color: '#999',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          margin: '8px 16px',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>※ データ取得までに時間が掛かります。</span>
        <span style={{ whiteSpace: 'nowrap' }}>気長にお待ちください。</span>
      </p>
    </div>
  );
};

/**
 * 表示するデータがないことを表示するコンポーネント
 */
const NoViewItem: React.FC = () => {
  return (
    <div>
      <p
        style={{
          fontSize: '0.8em',
          color: '#999',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          margin: '8px 16px',
        }}
      >
        <span style={{ whiteSpace: 'nowrap' }}>データの取得は完了していますが、</span>
        <span style={{ whiteSpace: 'nowrap' }}>今のところフォロワーの増減がありません。</span>
      </p>
    </div>
  );
};

/**
 * メインエリア
 */
const Main: React.FC<Pick<MyPageProps, 'items' | 'hasItems' | 'hasOnlyEmptyItems'>> = ({
  items,
  hasItems,
  hasOnlyEmptyItems,
}) => {
  if (hasOnlyEmptyItems) {
    return <NoViewItem />;
  }
  if (!hasItems) {
    return <NoItem />;
  }

  let currentDate = '';

  return (
    <main css={style.mainArea}>
      <nav css={style.labelNav}>
        <ul>
          <li data-type="yuku">ゆくひと</li>
          <li data-type="kuru">くるひと</li>
        </ul>
      </nav>
      {items.map((item, itemIndex) => {
        const date = item.durationEnd.toDate();
        const dateText = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
        const showDate = currentDate !== dateText;
        currentDate = dateText;

        return (
          <React.Fragment key={itemIndex}>
            {showDate && <h2 css={style.recordHead}>{dateText}</h2>}
            <section css={style.userSection} data-type={item.type}>
              <UserCard {...item} />
            </section>
          </React.Fragment>
        );
      })}
    </main>
  );
};

/**
 * マイページ全体のコンポーネント
 */
export const MyPage: React.FC<MyPageProps> = ({
  isLoading,
  isNextLoading,
  items,
  hasItems,
  hasOnlyEmptyItems,
  hasNext,
  hasToken,
  signOut,
  getNextRecords,
}) => (
  <div css={style.wrapper}>
    {!isLoading && <Error hasToken={hasToken} />}
    <header css={style.header}>
      <TweetButton size="large" />
      <ThemeSwitchButtonContainer>
        <MediaQuery minWidth={375}>{(matches: boolean) => (matches ? 'テーマを変更' : 'テーマ')}</MediaQuery>
      </ThemeSwitchButtonContainer>
      <button css={style.signOutButton} onClick={signOut}>
        ログアウト
      </button>
    </header>
    {isLoading ? (
      <p style={{ margin: 16 }}>読み込み中</p>
    ) : (
      <Main items={items} hasItems={hasItems} hasOnlyEmptyItems={hasOnlyEmptyItems} />
    )}
    {!isLoading && isNextLoading && <p style={{ margin: 16 }}>読み込み中</p>}
    {!isLoading && hasNext && (
      <button css={style.getNextButton} disabled={isNextLoading} onClick={() => getNextRecords()}>
        続きを取得
      </button>
    )}
    <nav css={style.nav}>
      <p>
        データが正常に表示されていないなどのお問い合わせは、
        <a href="https://twitter.com/yukukuruapp">Twitterからリプライ・DMにて</a>
        お知らせください
      </p>
    </nav>
  </div>
);