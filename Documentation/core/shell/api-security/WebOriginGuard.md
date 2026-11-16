# WebOriginGuard

`core/shell/api-security/WebOriginGuard.js`

Tells a request that a web page other than the gateway's own sent, or one that
arrived under a name DNS rebinding would use. [ApiSecurity](../ApiSecurity.md)
applies it to every caller that shows no API key, so a keyless caller can only
be a local program or one of the app's own pages.

## Methods

- `WebOriginGuard.refusal(req, { allowNavigation = false, hostname = os.hostname() })`
  returns `null` when the request may proceed, otherwise the reason
  (`HOST_REFUSED` or `ORIGIN_REFUSED`). The checks, in order:
  1. **Host.** Allowed: a loopback name, any IP address, a single-label name
     (`luma`, a Docker service name), a `.local` or `.localhost` name, and this
     computer's own name. A missing or malformed Host and any other dotted name
     are refused.
  2. **Page navigation**, only with `allowNavigation`: a `GET` whose
     `Sec-Fetch-Mode` is `navigate` and `Sec-Fetch-Dest` is `document` passes
     here, whatever site linked to it.
  3. **Origin.** Absent passes (programs send none, and neither does a
     same-origin GET). A present Origin, `null` included, must be http(s) on the
     very host and port the request was addressed to.
  4. **Sec-Fetch-Site.** Absent, `same-origin` and `none` pass; `cross-site` and
     `same-site` are refused.

## Why

The gateway used to answer any web origin, so a page the user merely visited
could call the whole API from their own browser. A page cannot forge `Origin`,
`Sec-Fetch-Site` or `Host`, so these three headers are enough to tell our pages
and plain programs from someone else's page:

- A cross-origin `fetch` or form post carries the page's `Origin`.
- An image tag or a `no-cors` fetch carries no `Origin`, but browsers add
  `Sec-Fetch-Site: cross-site` on requests to loopback.
- DNS rebinding makes the attacker's page same-origin with the gateway, but the
  request then carries the attacker's public DNS name as `Host`.

Another port on the same machine (`http://127.0.0.1:5173`) is a different
origin and is refused like any other: a local web app that calls the API needs
an API key.

`allowNavigation` exists for the page routes (`/llm-ui`, `/dashboard-ui`,
`/artifacts`): a link or a typed address may open them from anywhere, because
whoever reads the page is the user, never the site that linked to it. A frame
(`Sec-Fetch-Dest: iframe`) and a form post are not page navigations, so another
site can neither embed those pages nor post to them.

Browsers send `Sec-Fetch-*` only to addresses they treat as secure, loopback
among them. A page that reaches the gateway by a LAN address with a plain image
tag therefore passes this guard; it can only trigger a `GET` and cannot read
the reply.
