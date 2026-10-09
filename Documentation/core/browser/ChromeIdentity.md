# ChromeIdentity

`core/browser/ChromeIdentity.js`

The single source of truth for the Chrome identity the app presents to
websites: version, User-Agent string, client-hint values and UA metadata.

## Methods

- `ChromeIdentity.CHROME_VERSION` (`'154'`), `CHROME_FULL_VERSION`
  (`'154.0.8037.57'`), `CHROME_REDUCED_VERSION` (`'154.0.0.0'`). Keep the two in lockstep.
- `ChromeIdentity.USER_AGENT`: the Windows Chrome UA string with the reduced version.
- `ChromeIdentity.BRANDS` / `FULL_VERSION_BRANDS`: brand lists from
  [ChromeBrandList](identity/ChromeBrandList.md).
- `ChromeIdentity.PLATFORM_VERSION` (from [WindowsPlatformVersion](identity/WindowsPlatformVersion.md),
  read once at load), `ARCHITECTURE` (`arm` or `x86`), `BITNESS` (`32` or `64`).
- `ChromeIdentity.LOW_ENTROPY_HEADERS`: `Sec-CH-UA`, `Sec-CH-UA-Mobile`, `Sec-CH-UA-Platform`.
- `ChromeIdentity.HIGH_ENTROPY_OVERRIDES`: lowercase high-entropy hint name -> value.
- `ChromeIdentity.UA_METADATA`: the `Emulation.UserAgentMetadata` object.
- `ChromeIdentity.acceptLanguage()`: the UI locale plus its base language
  (`en-US,en`), as real Chrome sends; `en-US,en` outside Electron.
- `ChromeIdentity.applyToSession(sess)`: sets the UA string and Accept-Language
  on a session, once per session; a throwing session is ignored.
- `ChromeIdentity.overrideParams()`: the `setUserAgentOverride` parameters.

## Why

Electron's Chromium is several versions behind stable Chrome and reports its
real version in both the UA string and the client hints. `setUserAgent()` only
rewrites the string, and anti-bot services that cross-check UA against
Sec-CH-UA flag a mismatch as automation. So the string, the headers
([ClientHintHeaders](identity/ClientHintHeaders.md)) and the native
navigator values ([IdentityOverride](identity/IdentityOverride.md)) all derive
from the values here.
