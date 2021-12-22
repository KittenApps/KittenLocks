/* eslint-disable no-underscore-dangle */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { App as RealmApp } from 'realm-web';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import * as Sentry from '@sentry/react';
import { CachePersistor, LocalForageWrapper } from 'apollo3-cache-persist';
import localForage from 'localforage';

const VERSION = '0.1.0';
localForage.config({ name: 'KittenLocks', storeName: 'kittenlocks' });
const RealmAppContext = createContext();
const retryLink = new RetryLink({ delay: { initial: 300, max: Number.POSITIVE_INFINITY, jitter: true } });
const parseDate = { read: d => d && new Date(d) };
const restLink = new RestLink({
  uri: 'https://api.chaster.app',
  endpoints: { silizia: 'https://silizia.kittenlocks.de' },
  typePatcher: {
    Lock(data){
      for (const e of data.extensions){
        switch (e.slug){
          case 'verification-picture':
            e.__typename = 'VerificationExtension';
            e.userData.__typename = 'VerificationPictureHistory';
            break;
          case 'penalty':
            e.__typename = 'PenaltyExtension';
            break;
          case 'temporary-opening':
            e.__typename = 'TemporaryOpeningExtension';
            e.userData.__typename = 'TemporaryOpeningUserData';
            break;
          case 'tasks':
            e.__typename = 'TasksExtension';
            e.userData.__typename = 'TasksUserData';
            break;
          default:
            e.__typename = 'Extension';
        }
      }
      return data;
    }
  }
 });
const httpLink = new HttpLink({ uri: 'https://api.kittenlocks.de/graphql' });
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        users: { keyArgs: false },
        lockHistory: {
          keyArgs: ['lockId'],
          merge(ex, { 'results@type({"name":"LockHistory"})': results, count, hasMore }, { readField, args: { input: { lastId } } }){
            const existing = ex ? ex['results@type({"name":"LockHistory"})'] : [];
            if (!lastId || ex.refresh > 0){
              if (existing.length === 0) return { 'results@type({"name":"LockHistory"})': [...results], count, hasMore, refresh: 0 };
              const firstId = readField('_id', existing[ex.refresh || 0]);
              let offset = -1;
              for (const [i, result] of results.entries()){
                if (readField('_id', result) === firstId){
                  offset = i;
                  break;
                }
              }
              if (offset === -1){
                if (!hasMore) throw new Error('LockHistory: Couldn\'t find firstId in chache!');
                return { 'results@type({"name":"LockHistory"})': [...existing.slice(0, ex.refresh), ...results, ...existing.slice(ex.refresh)], count, hasMore, refresh: ex.refresh + results.length };
              }
              if (ex.refresh > 0) return { 'results@type({"name":"LockHistory"})': [...existing.slice(0, ex.refresh), ...results.slice(0, offset), ...existing.slice(ex.refresh)], count, hasMore: false, refresh: 0 };
              return { 'results@type({"name":"LockHistory"})': [...results.slice(0, offset), ...existing], count, hasMore: false, refresh: 0 };
            }
            if (lastId === readField('_id', existing.at(-1))) return { 'results@type({"name":"LockHistory"})': [...existing, ...results], count, hasMore, refresh: 0 };
            const merged = [...existing];
            let offset = -1;
            for (let i = existing.length - 1; i >= 0; --i){
              if (readField('_id', existing[i]) === lastId){
                offset = i + 1;
                break;
              }
            }
            if (offset < 0) throw new Error('LockHistory: Couldn\'t find lastId in chache!');
            for (const [i, result] of results.entries()){
              merged[offset + i] = result;
            }
            return { 'results@type({"name":"LockHistory"})': merged, count, hasMore, refresh: 0 };
          }
        }
      }
    },
    LockHistory: { keyFields: false, fields: { createdAt: parseDate, updatedAt: parseDate } },
    Lock: {
      keyFields: ['_id', 'role'],
      fields: { createdAt: parseDate, updatedAt: parseDate, startDate: parseDate, minDate: parseDate, maxDate: parseDate, maxLimitDate: parseDate, endDate: parseDate,
                deletedAt: parseDate, unlockedAt: parseDate, archivedAt: parseDate, frozenAt: parseDate, keyholderArchivedAt: parseDate }
    },
    Achievement: { fields: { grantedAt: parseDate } },
    SharedLock: { fields: { createdAt: parseDate, updatedAt: parseDate, deletedAt: parseDate, archivedAt: parseDate, minDate: parseDate, maxDate: parseDate, maxLimitDate: parseDate, lastSavedAt: parseDate } },
    Extension: { fields: { createdAt: parseDate, updatedAt: parseDate, nextActionDate: parseDate } },
    TasksExtension: { fields: { createdAt: parseDate, updatedAt: parseDate, nextActionDate: parseDate } },
    TemporaryOpeningExtension: { fields: { createdAt: parseDate, updatedAt: parseDate, nextActionDate: parseDate } },
    PenaltyExtension: { fields: { createdAt: parseDate, updatedAt: parseDate, nextActionDate: parseDate } },
    VerificationExtension: { fields: { createdAt: parseDate, updatedAt: parseDate, nextActionDate: parseDate } },
    TemporaryOpeningUserData: { fields: { openedAt: parseDate } },
    TasksUserData: { fields: { voteEndsAt: parseDate, voteStartedAt: parseDate } },
    VerificationPictureHistory: { fields: { requestedAt: parseDate } },
    VerificationPictureHistoryEntry: { fields: { submittedAt: parseDate } }
  }
});

const persistor = new CachePersistor({ cache, storage: new LocalForageWrapper(localForage), serialize: false, key: 'cache', maxSize: false });

export function useRealmApp(){
  const app = useContext(RealmAppContext);
  if (!app) throw new Error('You must call useRealmApp() inside of a <RealmAppProvider />');
  return app;
}

let accessTokenPromise = { accessToken: null, accessExpires: new Date(0) };

export function RealmAppProvider({ children }){
  const app = useMemo(() => new RealmApp({ id: 'kittenlocks-gcfgb', baseUrl: 'https://api.kittenlocks.de', skipLocationRequest: true }), []);
  const [currentUser, setCurrentUser] = useState(app.currentUser);
  const [lastAuth, setLastAuth] = useState(0);

  useEffect(() => {
    currentUser?.refreshCustomData().then(d => Sentry.setUser({ username: d.username }));
    setLastAuth(Date.now());
  }, [currentUser]);

  const logIn = useCallback(async credentials => {
    await app.logIn(credentials);
    if (currentUser === app.currentUser){ // scope upgrade
      await currentUser?.refreshCustomData();
      setLastAuth(Date.now());
    } else { // user logged in / switching users
      setCurrentUser(app.currentUser);
    }
    return app.currentUser.customData;
  }, [app, currentUser]);
  const logOut = useCallback(async() => {
    await app.currentUser?.logOut();
    Sentry.setUser(null);
    setCurrentUser(app.currentUser); // other logged in user or null
  }, [app]);

  const getAccessToken = useCallback(() => {
    if (!currentUser) throw new Error('Login required');
    const cDaT = currentUser?.customData?.access_token;
    const cDaE = currentUser?.customData?.access_expires.$date.$numberLong;
    if ((cDaE - Date.now()) / 60000 > 3) return Promise.resolve({ accessToken: cDaT, accessExpires: new Date(cDaE) });
    if (accessTokenPromise.then) return accessTokenPromise;
    const { accessToken, accessExpires } = accessTokenPromise;
    if ((accessExpires.getTime() - Date.now()) / 60000 > 3) return Promise.resolve({ accessToken, accessExpires });
    accessTokenPromise = currentUser.functions.getAccessToken().then(res => {
      if (res.error === 'Invalid refresh token') logOut();
      accessTokenPromise = { accessToken: res.accessToken, accessExpires: res.accessExpires };
      return accessTokenPromise;
    });
    return accessTokenPromise;
  }, [currentUser, logOut]);

  const authTokenLink = useMemo(() => setContext(({ query: { loc: { source: { body } } } }, { headers }) => {
    if (body.includes('@noauth')) return; // unauthenticated Chaster API
    if (!currentUser) throw new Error('Login required!');
    if (body.includes('@rest')){
      return getAccessToken().then(({ accessToken }) => ({ headers: { ...headers, Authorization: `Bearer ${accessToken}` } }));
    }
    const now = Date.now();
    if (now - lastAuth > 1795000){
      setLastAuth(now);
      return currentUser.refreshCustomData().then(() => ({ headers: { ...headers, Authorization: `Bearer ${currentUser.accessToken}` } }));
    }
    return { headers: { ...headers, Authorization: `Bearer ${currentUser.accessToken}` } };
  }), [currentUser, getAccessToken, lastAuth]);

  const [client, setClient] = useState(null);

  useEffect(() => localForage.getItem('version').then(v => (v === VERSION ? persistor.restore() : persistor.purge().then(() => localForage.setItem('version', VERSION))))
    .then(() => setClient(new ApolloClient({ connectToDevTools: true, link: from([authTokenLink, retryLink, restLink, httpLink]), cache }))), [authTokenLink]);

  if (!client){
    return <h2>Initializing app...</h2>;
  }

  const wrapped = { ...app, currentUser, logIn, logOut, cache, client, persistor };

  return <RealmAppContext.Provider value={wrapped}><ApolloProvider client={client}>{children}</ApolloProvider></RealmAppContext.Provider>;
}