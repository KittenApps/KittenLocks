let nIntervId;

function registerValidSW(swUrl, config){
  return navigator.serviceWorker.register(swUrl).then(registration => {
    registration.addEventListener('updatefound', () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.addEventListener('statechange', () => {
        if (installingWorker.state === 'installed'){
          if (navigator.serviceWorker.controller){
            if (config && config.onUpdate) config.onUpdate(registration);
          } else if (config && config.onSuccess) config.onSuccess(registration);
        }
      });
    });
    const wr = registration.waiting; // reload when visiting the site with not yet installed update
    if (wr){
      wr.addEventListener('statechange', e => e.target.state === 'activated' && window.location.reload());
      wr.postMessage({ type: 'SKIP_WAITING' }); // eslint-disable-line unicorn/require-post-message-target-origin
    }
    nIntervId = setInterval(() => navigator.onLine && registration.update(), 5 * 60 * 1000);
    return registration;
  }).catch(error => {
    console.error('Error during service worker registration:', error);
  });
}

function checkValidServiceWorker(swUrl, config){
  return fetch(swUrl, { headers: { 'Service-Worker': 'script' } }).then(response => {
    const contentType = response.headers.get('content-type');
    if (response.status === 404 || (contentType && !contentType.includes('javascript'))){
      navigator.serviceWorker.ready.then(reg => reg.unregister().then(() => window.location.reload()));
    } else {
      return registerValidSW(swUrl, config);
    }
  }).catch(() => {
    console.warn('No internet connection found. App is running in offline mode.');
  });
}

export function unregister(){
  if ('serviceWorker' in navigator){
    clearInterval(nIntervId);
    return navigator.serviceWorker.ready.then(reg => reg.unregister()).catch(error => console.error(error.message));
  }
}

export function register(config){
  if (process.env.NODE_ENV === 'production' && process.env.BRANCH !== 'beta' && 'serviceWorker' in navigator){
    const swUrl = '/service-worker.js';
    return window.location.hostname === 'localhost' ? checkValidServiceWorker(swUrl, config) : registerValidSW(swUrl, config);
  }
  return unregister();
}