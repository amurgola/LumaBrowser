# SiteInfoIpcHandlers

`core/browser/site-info/SiteInfoIpcHandlers.js`

`core.siteInfo.get`, `setPermission`, `setAdblock`, `clearData` ([SiteInfo](SiteInfo.md)), registered by
CoreIpcRegistrar and answered for the browser chrome only. The three changing channels take the origin the popup
was showing as their last argument and pass it on.
