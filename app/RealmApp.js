/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undefined */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { App as RealmApp } from 'realm-web';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import * as Sentry from '@sentry/react';

const RealmAppContext = createContext();
const retryLink = new RetryLink({ delay: { initial: 300, max: Number.POSITIVE_INFINITY, jitter: true } });
const restLink = new RestLink({
  uri: 'https://api.chaster.app',
  endpoints: { silizia: 'https://silizia.kittenlocks.de' },
  typePatcher: {
    Lock(data){ // eslint-disable-next-line no-underscore-dangle
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
            break;
          case 'tasks':
            e.__typename = 'TasksExtension';
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
        lockHistoryResult: {
          keyArgs: ['lockId'],
          merge(ex, { results, count, hasMore }, { readField, args: { input: { lastId } } }){
            const existing = ex?.results || [];
            if (!lastId || lastId === readField('_id', existing.at(-1))) return { results: [...existing, ...results], count, hasMore };
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
            return { results: merged, count, hasMore };
          }
        }
        /* mlocks: {
          keyArgs: false,
          merge(existing, incoming, { readField, args: { status } }){
            const merged = { ...existing };
            for (const item of incoming) merged[readField('_id', item)] = item;
            if (status === 'all') merged.all = 'all';
            return merged;
          },
          read(existing, { args: { status }, readField }){
            if (!existing) return;
            if (status === 'all'){
              if (existing.all === 'all') return Object.values(existing).filter(x => x !== 'all');
              return;
            }
            return existing.all === 'all' ? Object.values(existing).filter(x => x !== 'all' && readField('archivedAt', x) === null) : Object.values(existing);
          }
        }*/
      }
    },
    LockHistory: { keyFields: false }
  }
});

export function useRealmApp(){
  const app = useContext(RealmAppContext);
  if (!app) throw new Error('You must call useRealmApp() inside of a <RealmAppProvider />');
  return app;
}

export function RealmAppProvider({ children }){
  const app = useMemo(() => new RealmApp({ id: 'kittenlocks-gcfgb', baseUrl: 'https://api.kittenlocks.de', skipLocationRequest: true }), []);
  const [currentUser, setCurrentUser] = useState(app.currentUser);
  const [lastAuth, setLastAuth] = useState(0);

  useEffect(() => {
    currentUser?.refreshCustomData().then(d => Sentry.setUser({ username: d.username }));
    setLastAuth(Date.now());
  }, [currentUser]);

  async function logIn(credentials){
    await app.logIn(credentials);
    if (currentUser === app.currentUser){ // scope upgrade
      await currentUser?.refreshCustomData();
      setLastAuth(Date.now());
    } else { // user logged in / switching users
      setCurrentUser(app.currentUser);
    }
    return app.currentUser.customData;
  }
  async function logOut(){
    await app.currentUser?.logOut();
    Sentry.setUser(null);
    setCurrentUser(app.currentUser); // other logged in user or null
  }

  let accessTokenPromise = { accessToken: null, accessExpires: new Date(0) };

  function getAccessToken(){
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
  }

  const authTokenLink = setContext(({ query: { loc: { source: { body } } } }, { headers }) => {
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
  });

  const client = useMemo(() => new ApolloClient({ connectToDevTools: true, link: from([authTokenLink, retryLink, restLink, httpLink]), cache }), [authTokenLink]);

  const wrapped = { ...app, currentUser, logIn, logOut, getAccessToken, cache };

  return <RealmAppContext.Provider value={wrapped}><ApolloProvider client={client}>{children}</ApolloProvider></RealmAppContext.Provider>;
}