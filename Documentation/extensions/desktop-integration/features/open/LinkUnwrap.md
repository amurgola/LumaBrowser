# LinkUnwrap

`extensions/desktop-integration/features/open/LinkUnwrap.js`

Pure helper of the [open feature](index.md): turns the links Windows forces
through Edge or Bing into what they point at. No I/O. The Windhawk mod
[luma-link-redirect](../../../../integrations/windhawk/luma-link-redirect.wh.md)
carries a C++ mirror of the same rules.

## `LinkUnwrap.unwrap(input)`

Returns one of:

- `{ kind: 'url', url, news, wrapped }`: a web link (`news` when the host is
  `msn.com` or `microsoftstart.com`, or a subdomain);
- `{ kind: 'query', query, url, wrapped }`: a Bing search (`url` is the Bing
  results link);
- `{ kind: 'invalid', error }`: empty, over 16384 characters, not `http`/`https`
  after unwrapping, an Edge link without a target, or more than 6 nested
  wrappers.

`wrapped` says whether anything was peeled off. It never throws. Peeled, up to
6 levels deep, in any order:

| Form | Becomes |
| --- | --- |
| `--single-argument <link>` (msedge.exe's protocol form), surrounding quotes | `<link>` |
| `microsoft-edge:https://...` (scheme case-insensitive) | the inner link |
| `microsoft-edge:?url=<encoded>&...`, also `microsoft-edge://?url=` and `microsoft-edge:/?url=` | the decoded `url` parameter (`+` kept literal) |
| `microsoft-edge:https%3A%2F%2F...` | the percent-decoded link |
| `bing.com/ck/a`, `/aclick`, `/aclk` with `u=a1<base64url>` | the decoded target (when it is http/https) |
| the same with a plain `u=<url>` | that url |
| `bing.com/newtabredir?url=<url>` | that url |
| `*.bing.com/.../search?q=<terms>` (`/search`, `/images/search`, `/news/search`, ...) | `kind: 'query'` (a blank `q` stays a url) |
| `msn.com`, `microsoftstart.com` links | kept, `news: true` |

A Bing redirect whose payload is not a web link stays the Bing url. Look-alike
hosts (`notbing.com`, `bing.com.example`) are not Bing.

## Helpers

- `isWrapped(input)`: an Edge link or any Bing link.
- `isHttpUrl(input)`: parses as an `http`/`https` url with a host.
