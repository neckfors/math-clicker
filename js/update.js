// Service worker registration and the "New version available" bar.
// A new version waits until the player taps Update; the page never reloads by itself.
const bar = document.getElementById('updateBar');
const btn = document.getElementById('updateBtn');
const sw = navigator.serviceWorker;

if (sw) {
  let wanted = false;
  sw.register('sw.js').then(reg => {
    const show = () => { if (reg.waiting && sw.controller) bar.hidden = false; };
    show();
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', show);
    });
    btn.addEventListener('click', () => {
      wanted = true;
      if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
    });
    const check = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 30 * 60 * 1000);
  }).catch(() => {});
  sw.addEventListener('controllerchange', () => { if (wanted) location.reload(); });
}

// Version number of the service worker that is running this page.
export function getVersion() {
  if (!sw) return Promise.resolve('no offline support');
  return sw.ready.then(reg => new Promise(resolve => {
    const worker = sw.controller || reg.active;
    const ch = new MessageChannel();
    ch.port1.onmessage = e => resolve(e.data);
    worker.postMessage('GET_VERSION', [ch.port2]);
    setTimeout(() => resolve('unknown'), 2000);
  }));
}
