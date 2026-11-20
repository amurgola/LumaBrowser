# HiddenTab

`extensions/personal-hub/snapshot/HiddenTab.js`

Opens an address in a tab nobody sees, in the session that is signed in to
it, hands the loaded tab to a reader and always closes it. The Hub reads a
conversation, or a site's own lists, this way without touching the user's
tabs.

## Methods

- `static async use(browser, { url, partition, ready? }, read)` -> what
  `read(tabId)` answered, or `null`. `browser` is the BrowserService. The
  tab is made with `browser.createTab(url, { partition, silent: true, kind:
  'user', activate: false, title: 'Hub: reading a conversation' })`. It
  waits for the load (up to `LOAD_TIMEOUT_MS` = 20 s) and then, when `ready`
  is given and the browser has `waitFor`, for that selector to appear (up to
  `READY_TIMEOUT_MS` = 15 s), for an app that builds its page after loading.
  `null` when the tab could not be made, or anything on the way threw. The
  tab is closed in every case.

## Why a silent tab

A page laid out at no size draws nothing, and a persisted tab that was
never shown since the app started has no size. The browser gives a silent
tab a real size behind the tab on screen (see
[TabLayout](../../../core/browser/tab-view/TabLayout.md)), so the page lays
itself out and a list that only draws the rows in view has rows to read.

Used by [ConversationReader](ConversationReader.md) and [SlackSidebar](SlackSidebar.md).
