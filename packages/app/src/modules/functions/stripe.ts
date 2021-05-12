import { functions } from '../firebase';

export const getPortalLink = async (): Promise<string> => {
  const functionRef = functions.httpsCallable('ext-firestore-stripe-subscriptions-createPortalLink');
  const { data } = await functionRef({ returnUrl: window.location.origin });
  return data.url;
};
