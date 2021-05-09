import HomeIcon from '@material-ui/icons/Home';
import NotificationsIcon from '@material-ui/icons/Notifications';
import SettingsIcon from '@material-ui/icons/Settings';
import React from 'react';
import styles from './styles.module.scss';

export type NavType = 'home' | 'notification' | 'setting';

export type BottomNavProps = {
  active: NavType;
  onChange: (nav: NavType) => void;
};

export const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const type = e.currentTarget.value as NavType;
    onChange(type);

    // HOME 同士の場合、スクロールTOPする
    if (type === active && type === 'home') {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className={styles.nav}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <button className={styles.button} aria-selected={active === 'home'} value="home" onClick={onClick}>
            <HomeIcon />
            ホーム
          </button>
        </li>
        <li className={styles.item}>
          <button
            className={styles.button}
            aria-selected={active === 'notification'}
            value="notification"
            onClick={onClick}
          >
            <NotificationsIcon />
            お知らせ
          </button>
        </li>
        <li className={styles.item}>
          <button className={styles.button} aria-selected={active === 'setting'} value="setting" onClick={onClick}>
            <SettingsIcon />
            設定
          </button>
        </li>
      </ul>
    </nav>
  );
};
