# OmniboxResolver

`ui/shell/omnibox/OmniboxResolver.js`

Address-bar text to URL: known schemes pass, URL-shaped text gets https (http for loopback, private ranges and bare hosts), anything else is a search.

## Methods

- `OmniboxResolver.looksLikeUrl(text)`.
- `OmniboxResolver.resolve(text, searchUrl)`.

## Globals

None.
