# OpenText

`extensions/desktop-integration/features/open/OpenText.js`

Pure helper of the [open feature](index.md) behind `POST /open/text`: decides
what one line of free text means.

## `OpenText.classify(text, { askPrefix = '?' })`

In order:

1. empty (after trimming) -> `{ error }`;
2. starts with `askPrefix` (when not empty) -> `{ action: 'ask', prompt }`
   (the rest, trimmed; nothing after the prefix is an error);
3. starts with `microsoft-edge:` or `<scheme>://` -> through
   [LinkUnwrap](LinkUnwrap.md): `{ action: 'url', url, news, wrapped }`,
   `{ action: 'query', query, url, wrapped }` for a Bing search, or
   `{ error }` for a non-web scheme;
4. no whitespace and a bare host (`localhost`, an IPv4 address, or dotted
   labels ending in a letters-only TLD; optional port and path) -> the same,
   after [TabUrl](../../../../core/browser/TabUrl.md)`.normalize` adds the
   scheme (`http://` for loopback and private hosts, else `https://`);
5. anything else -> `{ action: 'query', query }`.

So `example.com is down` and `javascript:alert(1)` are searches, while
`file:///C:/` is an error.
