# OmniboxMatches

`ui/shell/omnibox/OmniboxMatches.js`

Local address-bar matches the history lookup cannot give: bookmarks (from the shell's BookmarkTree) and the tabs
already open. Every typed word must appear in the title or the bare address (no scheme, no `www.`). A match whose
address starts with the first word scores 3, one whose title (or a title word) starts with it 2, anything else 1;
ties keep their original order.

## Methods

- `OmniboxMatches.terms(query)`, `OmniboxMatches.bare(url)`, `OmniboxMatches.score(terms, url, title)`.
- `OmniboxMatches.bookmarks(nodes, query, limit = 3)` walks folders and returns `[{ url, title }]`; only http(s)
  bookmarks (no bookmarklets).
- `OmniboxMatches.openTabs(tabs, activeId, query, limit = 2)` returns `[{ id, url, title }]` for regular, visible
  http(s) tabs other than the active one.
