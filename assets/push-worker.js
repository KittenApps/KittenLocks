/* eslint-disable unicorn/filename-case, import/unambiguous */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'RELOAD_ALL_CLIENTS'){
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }) // eslint-disable-next-line unicorn/require-post-message-target-origin
      .then(clients => clients.filter(c => c.id !== event.source.id).map(c => c.postMessage({ type: 'CLIENT_RELOAD' }))));
  }
});