# SiteCard

`extensions/site-apis/ui/SiteCard.js`

One site on the settings page: name, origin, status pill (`StatusText.sitePill`: Signed in / Signed out / Unknown,
the statusNote as tooltip and as a line under the origin), the Open tab, Edit in chat and Delete actions, and an
[EndpointRow](EndpointRow.md) per endpoint (or "No endpoints yet").

## Methods

- `new SiteCard({ site, invoke, reload, openBuilder })`; `render()` answers the `.luma-card.sapi-site` element;
  `rows` the EndpointRows.
- Open tab: `showSiteTab(site.id)`; on success closes the Settings modal (the tab is now in front), else alerts.
- Edit in chat: `openBuilder({ siteId })`.
- Delete: `Dialogs.confirm` naming the endpoint count, then `deleteSite(site.id)` and `reload()`.
