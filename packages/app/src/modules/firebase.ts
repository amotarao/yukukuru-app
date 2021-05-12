import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore/memory';
import 'firebase/functions';

const app = firebase.apps.length
  ? firebase.app()
  : firebase.initializeApp({
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    });

const twitterAuthProvider = new firebase.auth.TwitterAuthProvider();
twitterAuthProvider.setCustomParameters({
  lang: 'ja',
});

export const auth = app.auth();
export const firestore = app.firestore();
export const functions = app.functions('asia-northeast1');

export const providers = {
  twitter: twitterAuthProvider,
};
