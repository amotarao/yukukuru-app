import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { LoadingCircle } from '../../components/atoms/LoadingCircle';
import { LoginPage } from '../../components/pages/LoginPage';
import { MyPage, MyPageProps } from '../../components/pages/MyPage';
import { useAuth } from '../../hooks/auth';
import { useRecords } from '../../hooks/records';
import { useToken } from '../../hooks/token';
import { useUser } from '../../hooks/user';
import { setLastViewing } from '../../modules/firestore/userStatuses';

const Page: React.FC = () => {
  const router = useRouter();
  const [{ isLoading: authIsLoading, signedIn, signingIn, user }, { signIn, signOut }] = useAuth();
  const [
    { isFirstLoading, isFirstLoaded, isNextLoading, items, hasNext },
    { setUid: setRecordsUid, getNextRecords },
  ] = useRecords();
  const [{ isLoading: userIsLoading, twitter, lastRunnedGetFollowers }, { setUid: setUserUid }] = useUser();
  const [{ isLoading: tokenIsLoading, hasToken }, { setUid: setTokenUid }] = useToken();

  const uid = user?.uid ?? null;
  const recordsIsLoading = isFirstLoading || !isFirstLoaded;
  const isLoading = authIsLoading || recordsIsLoading || userIsLoading || tokenIsLoading;

  // 各 hook に uid セット
  useEffect(() => {
    setRecordsUid(uid);
  }, [uid, setRecordsUid]);
  useEffect(() => {
    setTokenUid(uid);
  }, [uid, setTokenUid]);
  useEffect(() => {
    setUserUid(uid);
  }, [uid, setUserUid]);

  // signin 処理
  useEffect(() => {
    if (!authIsLoading && !signingIn && !signedIn && 'login' in router.query) {
      signIn();
    }
    if (signedIn && 'login' in router.query) {
      router.replace('/my');
    }
  }, [authIsLoading, signingIn, signedIn, router, signIn]);

  // lastViewing 送信
  useEffect(() => {
    if (!uid) {
      return;
    }
    setLastViewing(uid);
  }, [uid]);

  const props: MyPageProps = {
    isLoading,
    isNextLoading,
    items,
    hasNext,
    hasToken,
    lastRunnedGetFollowers,
    user: {
      name: twitter?.name ?? '',
      screenName: twitter?.screenName ?? '',
      photoUrl: twitter?.photoUrl ?? '',
    },
    getNextRecords,
    signOut,
  };

  return (
    <>
      <Head>
        <title>マイページ - ゆくくる alpha</title>
      </Head>
      {authIsLoading || signingIn ? (
        <LoadingCircle />
      ) : signedIn ? (
        <MyPage {...props} />
      ) : (
        <LoginPage signIn={signIn} />
      )}
    </>
  );
};

export default Page;
