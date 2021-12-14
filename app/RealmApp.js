import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { App as RealmApp } from 'realm-web';
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache, from } from '@apollo/client';
import { RestLink } from 'apollo-link-rest';
import { setContext } from '@apollo/client/link/context';
import { RetryLink } from '@apollo/client/link/retry';
import * as Sentry from '@sentry/react';

const RealmAppContext = createContext();
const retryLink = new RetryLink({ delay: { initial: 300, max: Number.POSITIVE_INFINITY, jitter: true } });
const restLink = new RestLink({ uri: 'https://api.chaster.app/' });
const httpLink = new HttpLink({ uri: 'https://realm.mongodb.com/api/client/v2.0/app/kittenlocks-gcfgb/graphql' });
const cache = new InMemoryCache();

export function useRealmApp(){
  const app = useContext(RealmAppContext);
  if (!app) throw new Error('You must call useRealmApp() inside of a <RealmAppProvider />');
  return app;
}

export function RealmAppProvider({ children }){
  const app = useMemo(() => new RealmApp('kittenlocks-gcfgb'), []);
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
    if (!currentUser) throw new Error('Login required!');
    if (body.includes('locks/user/')) return; // unauthenticated to work around Chaster API bug
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

  const client = useMemo(() => new ApolloClient({ link: from([authTokenLink, retryLink, restLink, httpLink]), cache }), [authTokenLink]);

  const wrapped = { ...app, currentUser, logIn, logOut, getAccessToken };

  return <RealmAppContext.Provider value={wrapped}><ApolloProvider client={client}>{children}</ApolloProvider></RealmAppContext.Provider>;
}