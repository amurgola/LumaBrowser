# PageBlockDetector

`core/browser/tab-manager/PageBlockDetector.js`

Recognises a page only the user can get past, from what `observe_page` already
read: a bot challenge (Cloudflare and friends), a CAPTCHA, a sign-in form or a
second-factor prompt. [PageObserver](PageObserver.md) appends the note to the
digest, so the model calls `ask_user_takeover` instead of clicking at the page
again (the loop agents are most often reported stuck in). Pure.

## Methods (all static)

- `detect(result)`: the element digest `{ title, url, viewport, below }` ->
  `{ kind, label, note }` or null. In order: `challenge` (`CHALLENGE_URL`:
  `/cdn-cgi/challenge`, `__cf_chl`, `/challenge-platform/`, `captcha`,
  `/sorry/`; `CHALLENGE_TITLE`: "Just a moment", "Attention Required", "Verify
  you are human", "Checking your browser", "Are you a robot", ...), `captcha`
  (an element label matching `CAPTCHA_LABEL`), `second_factor` (the title or a
  label matching `SECOND_FACTOR`: two-factor, verification code, one-time
  code, authenticator, ...), `login` (an `input:password` element, in view or
  below the fold).
- `note(kind)`: `BLOCKED: this page shows <label>. Only the user can get past
  it: do not click or type at it. Call ask_user_takeover with one sentence
  saying what to do in the tab, then observe the page again.`
- `KINDS`: kind -> label.
