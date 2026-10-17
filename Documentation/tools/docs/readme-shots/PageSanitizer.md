# PageSanitizer

`tools/docs/readme-shots/PageSanitizer.js`

Scrubs the owner's identity out of a page before it is captured. `scrub(page)` walks every text node under
`document.body`, every `input` and `textarea` value and every `title` attribute, and replaces the machine name
(`os.hostname()`) with `DESKTOP` and the home directory (`os.homedir()`) with the same drive and user folder shape
under a generic user (`C:\Users\you`, `/home/you`); on Windows the forward-slash form of the home dir is replaced
too. It runs in the page and changes the DOM only; nothing is written back to settings. Returns the number of
replacements.

Where it shows: the Setup page's `win32 x64 · kernel ... · <host>` line and the Models directory path.

## Methods

- `static homeStandIn(home, platform)`: the generic home dir for a real one.
- `static replacements()`: `[from, to]` pairs (pairs shorter than three characters are dropped so a tiny host name
  cannot rewrite unrelated text).
- `static scrub(page)`: applies them; `Promise<number>`.
