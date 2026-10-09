# WebDriverRouteTable

`extensions/selenium-driver/WebDriverRouteTable.js`

The endpoint table: the W3C Level 2 commands plus the vendor routes.

## Members

- `WebDriverRouteTable.ROUTES`: `[method, path, commandName, { requiresSession }]`.
  Only `GET /status` and `POST /session` work without a session. Vendor routes:
  `POST /session/:sessionId/lumabyte/find`, `/lumabyte/click`, `/lumabyte/dom/snapshot`,
  `/lumabyte/cdp/execute`, `/goog/cdp/execute`.
- `WebDriverRouteTable.remapParams(params)` keeps the Express names and adds
  `'element id'`, `'shadow id'`, `'property name'` (Express names cannot hold spaces).

A test checks every route names an existing command and every command is routed.
