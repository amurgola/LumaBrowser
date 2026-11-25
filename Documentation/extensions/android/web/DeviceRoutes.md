# DeviceRoutes

`extensions/android/web/DeviceRoutes.js`

Controller for `/api/ext/android`.

## Methods

- `GET /devices`, `POST /devices/:name/start`, `POST /devices/:name/stop`, `POST /viewer-token` `{ device }`, and the page's files from `ui/page` (never cached).
- Publishes the gateway's address into `gatewayInfo` and registers the `/ws` upgrade.
