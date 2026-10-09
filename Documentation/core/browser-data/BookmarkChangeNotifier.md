# BookmarkChangeNotifier

`core/browser-data/BookmarkChangeNotifier.js`

Broadcasts `bookmarks:changed` to the main window so the bookmarks bar and any
open bookmark manager refresh live.

## Methods

- `new BookmarkChangeNotifier(getMainWindow)`.
- `notify()`: sends `bookmarks:changed` when the window exists and is not destroyed.
- `afterMutation(mutation)`: runs `mutation()`, notifies, and returns its
  result. A throwing mutation propagates and sends nothing.
- `CHANNEL` is `'bookmarks:changed'`.
