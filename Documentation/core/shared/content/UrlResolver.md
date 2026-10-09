# UrlResolver

`core/shared/content/UrlResolver.js`

Turns an `href` into an absolute http(s) URL, or null.

## Methods

- `UrlResolver.forDocument(pageUrl, baseHref)`: a resolver whose base is the
  page URL refined by the document's `<base href>` (itself resolved against the
  page URL; an unusable base falls back to the page URL).
- `new UrlResolver(baseUrl)`, `resolve(href)`: absolute http(s) hrefs come back
  exactly as written; relative ones resolve against the base; fragments, empty
  hrefs, non-http schemes, and relative hrefs with no base give null.

## Why

A model can only act on a link it can fetch. Resolving relative links against
the page lets it follow in-site links that would otherwise be bare text.
Absolute links are not normalised, so the model sees the URL the page used.
