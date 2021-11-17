import { useState, useEffect, useContext, createContext} from "react";
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

let accessTokenPromise = { accessToken: null, accessExpires: new Date(0) } ;

export const RealmAppProvider = ({ appId, children }) => {
  const [app, setApp] = useState(new RealmApp(appId));
  useEffect(() => setApp(new RealmApp(appId)), [appId]);

  // Wrap the Realm.App object's user state with React state
  const [currentUser, setCurrentUser] = useState(app.currentUser);

  useEffect(() => {
    currentUser?.refreshCustomData();
  }, [currentUser]);

  async function logIn(credentials){
    const user = await app.logIn(credentials);
    if (currentUser) setCurrentUser(null);
    // If successful, app.currentUser is the user that just logged in
    setCurrentUser(app.currentUser);
  }
  async function logOut(){
    // Log out the currently active user
    await app.currentUser?.logOut();
    // If another user was logged in too, they're now the current user.
    // Otherwise, app.currentUser is null.
    setCurrentUser(app.currentUser);
  }

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

  return <RealmAppContext.Provider value={wrapped}>{children}</RealmAppContext.Provider>;
};