import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';
import { LoadingCircle } from '../../components/atoms/LoadingCircle';
import { MembershipSubscriptionPage } from '../../components/pages/MembershipSubscriptionPage';
import { useAuth } from '../../hooks/auth';

const stripePromise = loadStripe(process.env.STRIPE_API_KEY);

const Page: React.FC = () => {
  const router = useRouter();
  const [{ isLoading, signedIn, user }] = useAuth();

  // ログインしていないときは、トップページにリダイレクト
  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!signedIn) {
      router.replace('/');
    }
  }, [isLoading, signedIn, router]);

  return (
    <>
      <Head>
        <title>メンバーシップ - ゆくくる alpha</title>
      </Head>
      <Elements stripe={stripePromise}>
        {isLoading ? <LoadingCircle /> : <MembershipSubscriptionPage uid={user?.uid ?? null} />}
      </Elements>
    </>
  );
};

export default Page;
