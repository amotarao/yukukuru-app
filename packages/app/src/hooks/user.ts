import { Timestamp, UserData } from '@yukukuru/types';
import { useState, useEffect, useReducer } from 'react';
import { firestore } from '../modules/firebase';

type State = {
  isLoading: boolean;
  twitter: UserData['twitter'] | null;
  lastRunnedGetFollowers: Date;
};

const initialState: State = {
  isLoading: true,
  twitter: null,
  lastRunnedGetFollowers: new Date(0),
};

type DispatchAction =
  | {
      type: 'SetData';
      payload: Pick<State, 'twitter' | 'lastRunnedGetFollowers'>;
    }
  | {
      type: 'FinishLoading';
    };

const reducer = (state: State, action: DispatchAction): State => {
  switch (action.type) {
    case 'SetData': {
      return {
        isLoading: false,
        twitter: action.payload.twitter,
        lastRunnedGetFollowers: action.payload.lastRunnedGetFollowers,
      };
    }

    case 'FinishLoading': {
      return {
        ...state,
        isLoading: true,
      };
    }

    default: {
      return state;
    }
  }
};

type Action = {
  setUid: (uid: string | null) => void;
};

export const useUser = (): [State, Action] => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const unsubscribe = firestore
      .collection('users')
      .doc(uid)
      .onSnapshot((doc) => {
        if (!doc.exists) {
          dispatch({ type: 'FinishLoading' });
          return;
        }

        const twitter = doc.get('twitter') as UserData['twitter'];
        const lastRunnedGetFollowers = (doc.get('lastUpdated') as Timestamp).toDate();
        dispatch({ type: 'SetData', payload: { twitter, lastRunnedGetFollowers } });
      });

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return [state, { setUid }];
};
