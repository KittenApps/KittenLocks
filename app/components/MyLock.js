import * as React from "react";
import { useState, useEffect } from "react";
import { Skeleton } from '@material-ui/core';
import ReactJson from 'react-json-view';
import { useRealmApp } from "../RealmApp";

export default function MyLock(){
  const app = useRealmApp();

  const [lockJSON, setLockJSON] = useState(null);
  const [historyJSON, setHistoryJSOn] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let headers;
    const fetchHistory = async (id, lastId) => {
      headers["Content-Type"] = "application/json";
      const ch = await fetch(`https://api.chaster.app/locks/${id}/history`, { headers, signal, method: 'POST', body: JSON.stringify({ lastId, limit: 100 }) }).then(d => d.json());
      if (ch.hasMore){
        const rch = await fetchHistory(id, ch.results[99]._id);
        return ch.results.concat(rch);
      }
      return ch.results;
    }

    app.getAccessToken().then(({accessToken}) => {
      headers = { "Authorization": `Bearer ${accessToken}` };
      return fetch('https://api.chaster.app/locks', { headers, signal });
    }).then(d => d.json()).then(j => {
      setLockJSON(j.length === 1 ? j[0]: j);
      return Promise.all(j.map(l => fetchHistory(l._id))).then(j => setHistoryJSOn(j.length === 1 ? j[0]: j));
    });
    return () => controller.abort();
  }, []);


  return (
    <React.Fragment>
      <h2>My lock information ({app.currentUser.customData.username}):</h2>
      { lockJSON ? <ReactJson src={lockJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} />
                  : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
      <h2>My lock history ({app.currentUser.customData.username}):</h2>
      { historyJSON ? <ReactJson src={historyJSON} quotesOnKeys={false} enableAdd={false} enableEdit={false} enableDelete={false} collapsed={1} />
              : <Skeleton variant="rectangular" width={'100%'} height={300} /> }
    </React.Fragment>
  );
}