import { useStripe } from '@stripe/react-stripe-js';
import React, { useEffect, useState } from 'react';
import {
  addCheckoutSession,
  getActivePlanPrices,
  getActivePlans,
  getActiveTaxRates,
  getOwnActiveSubscriptions,
} from '../../../modules/firestore/stripe';
import { getPortalLink } from '../../../modules/functions/stripe';
import styles from './styles.module.scss';

export type MembershipSubscriptionPageProps = {
  uid: string | null;
};

export const MembershipSubscriptionPage: React.FC<MembershipSubscriptionPageProps> = ({ uid }) => {
  const stripe = useStripe();
  const [subscriptions, setSubscriptions] = useState<{ status: string; role: string }[]>([]);
  const [prices, setPrices] = useState<{ id: string; role: string }[]>([]);
  const [taxRates, setTaxRates] = useState<string[]>([]);

  const supporterPriceId = prices.find((price) => price.role === 'supporter')?.id ?? null;
  const isSupporter =
    (subscriptions.find((subscription) => subscription.role === 'supporter')?.status ?? '') === 'active';

  // 自身の subscription を取得
  useEffect(() => {
    if (!uid) return;
    getOwnActiveSubscriptions(uid).then((querySnapshot) => {
      setSubscriptions(querySnapshot.docs.map((doc) => doc.data()));
    });
  }, [uid]);

  // プランを取得
  useEffect(() => {
    getActivePlans().then((querySnapshot) => {
      querySnapshot.docs.forEach((doc) => {
        const role = doc.get('role');
        getActivePlanPrices(doc.ref).then((priceQuerySnapshot) => {
          priceQuerySnapshot.docs.forEach((doc) => {
            setPrices((prices) => {
              return [...prices, { id: doc.id, role }];
            });
          });
        });
      });
    });
  }, []);

  // 税率を取得
  useEffect(() => {
    getActiveTaxRates().then((querySnapshot) => {
      setTaxRates(querySnapshot.docs.map((doc) => doc.id));
    });
  }, []);

  const checkoutSupporter: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const sessionId = await addCheckoutSession(uid, supporterPriceId, taxRates).catch(alert);
    if (sessionId) {
      stripe.redirectToCheckout({ sessionId });
    }
  };

  const portal = async () => {
    const url = await getPortalLink();
    window.location.assign(url);
  };

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.head}>ゆくくるメンバーシップ</h1>
      </header>
      <section className={[styles.section, styles.free].join(' ')}>
        <h2 className={styles.subHead}>無料プラン</h2>
        <p className={styles.price}>
          <small>¥</small>0
        </p>
      </section>
      <section className={[styles.section, styles.supporter].join(' ')}>
        <h2 className={styles.subHead}>
          サポーター
          <wbr />
          プラン
        </h2>
        <p className={styles.price}>
          <small>¥</small>99<small>/月</small>
        </p>
        {isSupporter ? (
          <>
            <p>登録済み</p>
          </>
        ) : (
          <button className={styles.button} onClick={checkoutSupporter}>
            登録
          </button>
        )}
        <button className={styles.button} onClick={checkoutSupporter}>
          登録
        </button>
        <button className={styles.button} onClick={portal}>
          登録情報確認・解約など
        </button>
      </section>
      <section className={styles.comparison}>
        <dl className={styles.featureList}>
          <div className={styles.featureItem}>
            <dt className={styles.featureItemTitle}>フォロワー取得頻度</dt>
            <dd className={styles.featureItemText}>最短60分おき</dd>
          </div>
        </dl>
        <dl className={styles.featureList}>
          <div className={styles.featureItem}>
            <dt className={styles.featureItemTitle}>フォロワー取得頻度</dt>
            <dd className={styles.featureItemText}>最短15分おき</dd>
          </div>
        </dl>
      </section>
    </main>
  );
};
