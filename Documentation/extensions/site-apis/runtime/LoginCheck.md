# LoginCheck

`extensions/site-apis/runtime/LoginCheck.js`

After a navigation, decides whether the site has signed the hidden tab out, and keeps the site's status in step.

## Methods

- `new LoginCheck({ browser, onSiteStatus, showSiteTab, notice, logger })`: `notice` is a
  [SignedOutNotice](SignedOutNotice.md).
- `check(site, tabId)`: resolves the current URL (`executeJs('location.href')`) or throws `needs_login`
  (`detail.url`) when, in order:
  - the URL matches one of `site.login.signInUrlPatterns` (a substring, or a regular expression written as
    `/.../flags`);
  - the URL is on a well-known sign-in page (`SIGN_IN_PAGES`, copied from personal-hub's `SignInPages`), unless
    the site itself lives on that host;
  - `signedOutSelector` is on the page, or `signedInSelector` is not (`browser.checkSelectors`); a failed check
    counts as unknown, not signed out.
  A sign-out calls `onSiteStatus(site.id, 'signed_out', reason)` and shows the notice (click: `showSiteTab(site.id)`)
  once per sign-out; repeated failing runs do not repeat either.
- `markOk(site)`: `onSiteStatus(site.id, 'ok', null)` only when the site was not already ok (the record's
  `status` or this runner's last report).

## Decisions

- The reported status is tracked per site in the runner (`_reported`) because the `site` record a run receives is a
  snapshot: after a sign-out the next success must report ok even if the caller's record still says ok.
- The built-in table is applied for every site; the own-host exclusion keeps a Google or ClickUp site usable.
