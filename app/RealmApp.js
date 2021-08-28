import React from "react";
import * as Realm from "realm-web";

const RealmAppContext = React.createContext();

export const useRealmApp = () => {
  const app = React.useContext(RealmAppContext);
  if (!app) {
    throw new Error(
      `You must call useRealmApp() inside of a <RealmAppProvider />`
    );
  }
  return app;
};

export const RealmAppProvider = ({ appId, children }) => {
  const [app, setApp] = React.useState(new Realm.App(appId));
  React.useEffect(() => setApp(new Realm.App(appId)), [appId]);

  // Wrap the Realm.App object's user state with React state
  const [currentUser, setCurrentUser] = React.useState(app.currentUser);

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

  const [accessToken, setAccessToken] = React.useState(null);
  const [accessExpires, setAccessExpires] = React.useState(null);

  React.useEffect(() => {
    setAccessToken(currentUser?.customData?.access_token);
    setAccessExpires(new Date(parseInt(currentUser?.customData?.access_expires.$date.$numberLong)));
  }, [currentUser]);

  async function getAccessToken(){
    if (!accessToken) throw new Error("Login required");
    if ((accessExpires - new Date())/60000 > 3) return { accessToken, accessExpires };
    const { error, access_token, access_expires } = await currentUser.functions.getAccessToken();
    if (error === 'Invalid refresh token'){
      await logOut();
      throw new Error("refresh token expired");
    }
    setAccessToken(access_token);
    setAccessExpires(new Date(access_expires));
    currentUser.refreshCustomData();
    return { accessToken: access_token, accessExpires: new Date(access_expires) };
  }

  const wrapped = { ...app, currentUser, logIn, logOut, getAccessToken };

  return <RealmAppContext.Provider value={wrapped}>{children}</RealmAppContext.Provider>;
};