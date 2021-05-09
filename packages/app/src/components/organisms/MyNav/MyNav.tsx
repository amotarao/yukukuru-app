import HomeIcon from '@material-ui/icons/Home';
import SettingsIcon from '@material-ui/icons/Settings';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { ProfileImage } from '../../atoms/ProfileImage';
import styles from './styles.module.scss';

export type NavType = 'home' | 'setting';

export type MyNavProps = {
  active: NavType;
  userImageUrl: string;
  onChange: (nav: NavType) => void;
  signOut: () => void | Promise<void>;
};

export const MyNav: React.FC<MyNavProps> = ({ active, userImageUrl, onChange, signOut }) => {
  const router = useRouter();

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
          <button className={styles.button} aria-selected={active === 'setting'} value="setting" onClick={onClick}>
            <SettingsIcon />
            設定
          </button>
        </li>
      </ul>
      <button className={styles.user}>
        <ProfileImage className={styles.userIcon} src={userImageUrl} alt="ユーザー設定" />
      </button>
      <nav className={styles.userMenu}>
        <ul className={styles.menuList}>
          <li className={styles.menuItem}>
            <Link href="/" passHref>
              <a
                className={styles.menuCard}
                onClick={() => {
                  signOut();
                }}
              >
                <p>ログアウトし、トップページに戻る</p>
              </a>
            </Link>
          </li>
          <li className={styles.menuItem}>
            <Link href="/my?login" passHref>
              <a
                className={styles.menuCard}
                onClick={async (e) => {
                  e.preventDefault();
                  await signOut();
                  router.replace('/my?login');
                }}
              >
                <p>ログアウトし、別のアカウントでログイン</p>
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </nav>
  );
};
