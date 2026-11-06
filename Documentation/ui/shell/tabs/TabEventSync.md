# TabEventSync

`ui/shell/tabs/TabEventSync.js`

Applies main's tab events: `tab:state` (mirror, strip, toolbar for the active tab, BrowserRenderer events), `tab:switched`, `tab:closed`, `tab:hidden`, `tab:moved`, `tab:transferred` (the tab was dragged into another window: it leaves this strip and mirror and BrowserRenderer hears `tabClosed`, but it is not remembered as a closed tab), and intercepted notifications to `window.handleNotification`.

## Methods

- `new TabEventSync(deps)`.
- `install()`, `onState(state)`, `onSwitched({ id })`, `onClosed({ id })`, `onHidden({ id })`, `onMoved(p)`, `onTransferred({ id })`.
- A new tab is appended to the strip; when main placed it elsewhere (a link opened after its opener, a pinned
  tab) the full order from `tabAPI.getOrder()` re-sorts the strip.
- The active tab's state also updates the address bar's blocked pop-up badge (`popupBadge`) and, when its URL changed
  or another tab became active, the saved-password key (`vaultKey`); a switch re-renders the save-password bubble
  (`vaultPrompt`) so only the active tab's offer shows.

## Globals

Reads `window.tabAPI`, `window.handleNotification` (replaced by notification-interceptor).
