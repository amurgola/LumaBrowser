# UrlIdentity

`core/llm-server/chat/web-tools/UrlIdentity.js`

Decides when two URLs name the same page.

## Methods (static)

- `key(url)`: trimmed, `#fragment` removed, `http(s)://` and a leading `www.`
  removed, trailing slashes removed, lowercased; `''` for empty input.
- `same(a, b)`: equal keys.

## Why

One definition of "same page" for the redirect note, the page cache, result
de-duplication and near-match healing. Fragments never change what a server
returns; query strings do, so they stay.
