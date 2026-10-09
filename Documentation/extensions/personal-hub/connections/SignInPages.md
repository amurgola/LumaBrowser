# SignInPages

`extensions/personal-hub/connections/SignInPages.js`

The addresses a web app sends a signed-out user to: Google's account pages,
Microsoft's login (`login.microsoftonline.com`, `login.live.com`), Slack's
workspace sign-in, ClickUp's `/login`, the Messages pairing page, Proton's
account login and Discord's `/login`. A persisted tab sitting on one of these
has lost its session, whatever app it was opened for.

## Methods (static)

- `isSignIn(url)`: whether `url` is one of those pages (false for anything
  unparsable). `PAGES` is the `[host suffix, path pattern or null]` table.

Used by [ConnectionMonitor](ConnectionMonitor.md) and
[MicrosoftAccounts](MicrosoftAccounts.md).
