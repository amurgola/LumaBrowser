# TabEventSync

`ui/shell/tabs/TabEventSync.js`

Applies main's tab events: `tab:state` (mirror, strip, toolbar for the active tab, BrowserRenderer events), `tab:switched`, `tab:closed`, `tab:hidden`, `tab:moved`, `tab:transferred` (the tab was dragged into another window: it leaves this strip and mirror and BrowserRenderer hears `tabClosed`, but it is not remembered as a closed tab), and intercepted notifications to `window.handleNotification`.

## Methods

- `new TabEventSync(deps)`.
- `install()`, `onState(state)`, `onSwitched({ id })`, `onClosed({ id })`, `onHidden({ id })`, `onMoved(p)`, `onTransferred({ id })`.

## Globals

Reads `window.tabAPI`, `window.handleNotification` (replaced by notification-interceptor).
