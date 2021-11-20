import { useState, useEffect, useMemo, useContext, createContext} from "react";
import { App as RealmApp } from "realm-web";

const RealmAppContext = createContext();

export const useRealmApp = () => {
  const app = useContext(RealmAppContext);
  if (!app) {
    throw new Error(
      `You must call useRealmApp() inside of a <RealmAppProvider />`
    );
  }
  return app;
};

export const RealmAppProvider = (props) => {
  const app = useMemo(() => new RealmApp("kittenlocks-gcfgb"), []);

  // Wrap the Realm.App object's user state with React state
  const [currentUser, setCurrentUser] = useState(app.currentUser);
  const [u, update] = useState(0);

  useEffect(() => {
    currentUser?.refreshCustomData();
  }, [currentUser]);

  async function logIn(credentials){
    await app.logIn(credentials);
    if (currentUser == app.currentUser) { // scope upgrade
      await currentUser?.refreshCustomData();
      update(u + 1);
    } else { // user logged in / switching users
      setCurrentUser(app.currentUser);
    }
  }
  async function logOut(){
    await app.currentUser?.logOut();
    setCurrentUser(app.currentUser); // other logged in user or null
  }

  let accessTokenPromise = { accessToken: null, accessExpires: new Date(0) } ;

  function getAccessToken(){
    if (!currentUser) throw new Error("Login required");
    const cDaT = currentUser?.customData?.access_token;
    const cDaE = currentUser?.customData?.access_expires.$date.$numberLong;
    if ((cDaE - Date.now())/60000 > 3) return Promise.resolve({ accessToken: cDaT, accessExpires: new Date(cDaE) });
    if (accessTokenPromise.then) return accessTokenPromise;
    const {accessToken, accessExpires} = accessTokenPromise;
    if ((accessExpires - new Date())/60000 > 3) return Promise.resolve({ accessToken, accessExpires });
    accessTokenPromise = currentUser.functions.getAccessToken().then(({access_token, access_expires, error}) => {
      if (error === 'Invalid refresh token') logOut();
      accessTokenPromise = { accessToken: access_token, accessExpires: access_expires };;
      return accessTokenPromise;
    });
    return accessTokenPromise;
  }

  const wrapped = { ...app, currentUser, logIn, logOut, getAccessToken };

  return <RealmAppContext.Provider value={wrapped}>{props.children}</RealmAppContext.Provider>;
};