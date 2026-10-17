# BookmarkStar

`ui/shell/bookmarks/BookmarkStar.js`

The address-bar star (and Ctrl+D): filled when the page is bookmarked (the button's sprite `<use>` switches between `BookmarkStar.EMPTY` `i-star` and `BookmarkStar.FILLED` `i-star-filled`); a click bookmarks if needed and opens the edit bar (a second click closes it).

## Methods

- `install()`, `refresh(url)`, `clicked()`, `btn`.
- `BookmarkStar.isWebUrl(url)`.

## Globals

Reads `window.bookmarksAPI`.
