/* eslint-disable no-underscore-dangle */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { App as RealmApp } from 'realm-web';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import { setUser as setSentryUser } from '@sentry/react';
import { CachePersistor, LocalForageWrapper } from 'apollo3-cache-persist';
import localForage from 'localforage';
import LoadingPage from './components/LoadingPage';

const VERSION = '0.1.2';
localForage.config({ name: 'KittenLocks', storeName: 'kittenlocks' });
const RealmAppContext = createContext();
const retryLink = new RetryLink({ delay: { initial: 300, max: Number.POSITIVE_INFINITY, jitter: true } });
const parseDate = { read: d => d && new Date(d) };
const Lock = data => {
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
};
const restLink = new RestLink({
  uri: 'https://api.chaster.app',
  endpoints: { silizia: 'https://silizia.kittenlocks.de' },
  typePatcher: {
    Lock,
    Wearers(data){
      for (const l of data.locks){
        l.__typename = 'Lock';
        Lock(l); // eslint-disable-line new-cap
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
        },
        wearers: {
          keyArgs: ['input', ['status'], 'myWearers'],
          merge(existing, incoming, { args: { input: { page, limit } } }){
            const locks = existing ? [...existing.locks] : [];
            for (const [i, element] of incoming.locks.entries()){
              locks[page * limit + i] = element;
            }
            return { ...incoming, locks };
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
    VerificationPicture: { fields: { submittedAt: parseDate } }
  }
});

const persistor = new CachePersistor({ cache, storage: new LocalForageWrapper(localForage), serialize: false, key: 'cache', maxSize: false });

const immutableCurrentUser = u => Object.create(Object.getPrototypeOf(u), {
  customData: { enumerable: true, writable: true, value: u.customData },
  accessToken: { enumerable: true, writable: true, value: u.accessToken },
  deviceId: { enumerable: true, writable: true, value: u.deviceId },
  identities: { enumerable: true, writable: true, value: u.identities },
  isLoggedIn: { enumerable: true, writable: true, value: u.isLoggedIn },
  profile: { enumerable: true, writable: true, value: u.profile },
  refreshToken: { enumerable: true, writable: true, value: u.refreshToken },
  state: { enumerable: true, writable: true, value: u.state },
  apiKeys: { enumerable: true, writable: true, value: u.apiKeys },
  app: { enumerable: true, writable: true, value: u.app },
  fetcher: { enumerable: true, writable: true, value: u.fetcher },
  functions: { enumerable: true, writable: true, value: u.functions },
  id: { enumerable: true, writable: true, value: u.id },
  providerType: { enumerable: true, writable: true, value: u.providerType },
  storage: { enumerable: true, writable: true, value: u.storage },
  _accessToken: { enumerable: true, writable: true, value: u._accessToken },
  _profile: { enumerable: true, writable: true, value: u._profile },
  _refreshToken: { enumerable: true, writable: true, value: u._refreshToken }
});

export function useRealmApp(){
  const app = useContext(RealmAppContext);
  if (!app) throw new Error('You must call useRealmApp() inside of a <RealmAppProvider />');
  return app;
}

let accessTokenPromise = { accessToken: null, accessExpires: new Date(0) };

export function RealmAppProvider({ children }){
  const app = useMemo(() => new RealmApp({ id: 'kittenlocks-gcfgb', baseUrl: 'https://api.kittenlocks.de', skipLocationRequest: true }), []);
  const [currentUser, setCurrentUser] = useState(app.currentUser ? immutableCurrentUser(app.currentUser) : null);
  const [lastAuth, setLastAuth] = useState(0);

  useEffect(() => {
    setSentryUser({ username: currentUser?.customData?.username, id: currentUser?.customData?._id });
  }, [currentUser]);

  const logIn = useCallback(async credentials => {
    const user = await app.logIn(credentials);
    setLastAuth(Date.now());
    setCurrentUser(immutableCurrentUser(user));
  }, [app]);

  const logOut = useCallback(async() => {
    await app.currentUser?.logOut();
    setCurrentUser(app.currentUser); // other logged in user or null
    setLastAuth(0);
  }, [app.currentUser]);

  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    localForage.getItem('version').then(v => (v === VERSION ? persistor.restore() : persistor.purge().then(() => localForage.setItem('version', VERSION)))).then(() => setCacheReady(true));
  }, []);

  if (!cacheReady) return <LoadingPage/>;

  const authTokenLink = setContext(({ query: { loc: { source: { body } } } }, { headers }) => {
    if (body.includes('@noauth')) return; // unauthenticated Chaster API
    if (!currentUser?.customData) throw new Error('Login required!');
    const now = Date.now();
    if (body.includes('@rest')){
      const cDaT = currentUser?.customData?.access_token;
      const cDaE = currentUser?.customData?.access_expires.$date.$numberLong;
      if ((cDaE - now) / 60000 > 3) return { headers: { ...headers, Authorization: `Bearer ${cDaT}` } };
      if (accessTokenPromise.then) return accessTokenPromise.then(({ accessToken }) => ({ headers: { ...headers, Authorization: `Bearer ${accessToken}` } }));
      const { accessToken, accessExpires } = accessTokenPromise;
      if ((accessExpires.getTime() - now) / 60000 > 3) return { headers: { ...headers, Authorization: `Bearer ${accessToken}` } };
      const getATP = res => {
        if (res.error === 'Invalid refresh token') return app.currentUser?.logOut().then(() => window.location.reload());
        accessTokenPromise = { accessToken: res.accessToken, accessExpires: res.accessExpires };
        return accessTokenPromise;
      };
      accessTokenPromise = now - lastAuth > 1795000
        ? app.currentUser.refreshAccessToken().then(() => {setLastAuth(Date.now()); return app.currentUser.functions.getAccessToken();}).then(getATP)
        : app.currentUser.functions.getAccessToken().then(getATP);
      return accessTokenPromise.then(({ accessToken: at }) => ({ headers: { ...headers, Authorization: `Bearer ${at}` } }));
    }
    if (now - lastAuth > 1795000) return app.currentUser.refreshAccessToken().then(() => {
      setLastAuth(Date.now());
      return { headers: { ...headers, Authorization: `Bearer ${app.currentUser.accessToken}` } };
    });
    return { headers: { ...headers, Authorization: `Bearer ${app.currentUser.accessToken}` } };
  });

  const client = new ApolloClient({ link: from([retryLink, authTokenLink, restLink, httpLink]), cache });

  const wrapped = { ...app, currentUser, logIn, logOut, cache, client, persistor };

  return <RealmAppContext.Provider value={wrapped}><ApolloProvider client={client}>{children}</ApolloProvider></RealmAppContext.Provider>;
}