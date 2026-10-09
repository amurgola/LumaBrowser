# ServiceWorkerRegistrar

`core/network-sharing/webapp/public/js/web/ServiceWorkerRegistrar.js`

`ServiceWorkerRegistrar.register(win)`: when `navigator.serviceWorker` exists,
registers `sw.js` (relative to the page) on `load`, ignoring failures (it only
installs in a secure context, and the app is online-first). Returns whether it
was supported. See [sw.js](../../sw.md).
