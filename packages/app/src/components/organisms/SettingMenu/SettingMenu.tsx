import Switch from '@material-ui/core/Switch';
import React from 'react';
import { ThemeContainer } from '../../../store/theme';
import { TweetButton } from '../TweetButton';
import styles from './styles.module.scss';

export const SettingMenu: React.FC = () => {
  const { theme, setTheme } = ThemeContainer.useContainer();

  return (
    <>
      <ul className={styles.list}>
        <li className={styles.item}>
          <div className={styles.card}>
            <p>ダークテーマ</p>
            <Switch
              checked={theme === 'dark'}
              onChange={() => {
                setTheme(theme === 'dark' ? 'default' : 'dark');
              }}
              color="primary"
              inputProps={{ 'aria-label': 'ダークテーマにする' }}
            />
          </div>
        </li>
      </ul>
      <div className={styles.twitter}>
        <p>
          <a href="https://twitter.com/intent/follow?screen_name=yukukuruapp" target="_blank" rel="noopener noreferrer">
            公式Twitterをフォローする @yukukuruapp
          </a>
        </p>
        <p>
          <a href="https://twitter.com/yukukuruapp" target="_blank" rel="noopener noreferrer">
            不具合はリプライかDMでお問い合わせください
          </a>
        </p>
        <p>
          <a href="https://odaibako.net/u/yukukuruapp" target="_blank" rel="noopener noreferrer">
            お題箱でもご意見受付中！
          </a>
          (お題箱への書き込みは公開されます)
        </p>
        <TweetButton size="large" />
      </div>
    </>
  );
};
