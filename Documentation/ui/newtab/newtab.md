# New tab page files

`ui/newtab/newtab.html`, `ui/newtab/newtab.css`, `ui/newtab/newtab.js`

Served at `luma://newtab/` by [NewTabPage](../../core/browser/newtab/NewTabPage.md). The HTML has a strict CSP (own
script and style, images from data/http/https). The CSS inlines the shell palette (the page cannot reach the app's
stylesheets) and follows the system light/dark preference. The script reads `window.lumaNewTab`:
- it fills the search placeholder with the engine name;
- it renders the site tiles (favicon or first letter, host name, an x that hides the site);
- search navigates to the engine's results URL from main.
