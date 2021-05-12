import type firebase from 'firebase/app';
import { firestore } from '../firebase';

const customersCollection = firestore.collection('stripeCustomers');
const plansCollection = firestore.collection('stripePlans');

export const getOwnActiveSubscriptions = (uid: string): Promise<firebase.firestore.QuerySnapshot> => {
  return customersCollection.doc(uid).collection('subscriptions').where('status', 'in', ['trialing', 'active']).get();
};

export const addCheckoutSession = async (uid: string, price: string, taxRates: string[]): Promise<string> => {
  const ref = await customersCollection.doc(uid).collection('checkout_sessions').add({
    price: price,
    tax_rates: taxRates,
    success_url: window.location.origin,
    cancel_url: window.location.origin,
    billing_address_collection: 'auto',
  });

  return new Promise((resolve, reject) => {
    const unsubscribe = ref.onSnapshot((snap) => {
      const { error, sessionId } = snap.data();

      if (error) {
        unsubscribe();
        return reject(new Error(`An error occured: ${error.message}`));
      }

      if (sessionId) {
        unsubscribe();
        return resolve(sessionId);
      }
    });
  });
};

export const getActivePlans = (): Promise<firebase.firestore.QuerySnapshot> => {
  return plansCollection.where('active', '==', true).get();
};

export const getActivePlanPrices = (
  ref: firebase.firestore.DocumentReference
): Promise<firebase.firestore.QuerySnapshot> => {
  return ref.collection('prices').where('active', '==', true).get();
};

export const getActiveTaxRates = (): Promise<firebase.firestore.QuerySnapshot> => {
  return plansCollection.doc('tax_rates').collection('tax_rates').where('active', '==', true).get();
};
