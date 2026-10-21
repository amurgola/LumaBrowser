# routes

`extensions/site-apis/routes.js`

REST routes of Site APIs, mounted at `/api/site-apis` (`context.extensionApi` is the SiteApiService).

| Route | Reply |
|---|---|
| `GET /sites` | `{ success, sites, count }` (sites with endpoint summaries) |
| `GET /sites/:site` | `{ success, site }` with `site.endpoints`; 404 |
| `DELETE /sites/:site` | `{ success, message }`; 404 |
| `GET /sites/:site/endpoints` | `{ success, endpoints, count }`; 404 |
| `GET /sites/:site/endpoints/:name` | `{ success, endpoint }`; 404 |
| `DELETE /sites/:site/endpoints/:name` | `{ success, message }`; 404 |
| `POST /sites/:site/endpoints/:name/run` | body is the params (or `{ params }`); 200 with the RunResult, 422 with the RunResult (`{ success: false, fault, advice, ... }`) on a fault; 404 |
| `GET /runs/:id` | `{ success, run }`; 404 |
| `POST /sites/:site/show-tab` | the service's `{ success, tabId }`; 409 when it fails (no persisted tab); 404 |

A throw is `500 { success: false, error, message }`.
