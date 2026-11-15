# viewer.html, viewer.css, viewer.js (tab-share)

`extensions/tab-share/web/viewer.html`, `viewer.css`, `viewer.js`

The page a guest opens from a `/tab/<token>` link, served by
[TabShareWebRouter](../TabShareWebRouter.md) (`/tab/:token` sends
`viewer.html`, `/tab/assets/*` serves this folder). It runs in the guest's
own browser with no preload. Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts).

## Behaviour

- Connects to `ws(s)://<host>/tab/<token>/ws`; JPEG frame blobs are painted
  into `#frame` fitted to the stage; JSON messages: `hello` (mode, title,
  url, view size, WebRTC offer), `frame` (frame and view size), `meta`,
  `mode`, `rtc` (signalling), `ended` (`full` -> "Too many viewers", else
  "Sharing ended").
- Status line: Connecting, Live, Waiting/Reconnecting (with backoff up to 5 s
  and a "Waiting for the tab" overlay after the third retry), Paused while the
  page is hidden (the socket is closed so the host stops capturing).
- Interact mode sends normalised pointer, wheel and key messages; on touch a
  tap clicks, a drag scrolls and the Keyboard button focuses a hidden text sink.
- Fit (`#btnFit`, "Fit to my window", in the header, interact mode only; the
  icon alone on touch): pressing it sends `{ t:'size', w, h }`, the stage's
  size in CSS px, and the host sizes the tab to it (up to its own content
  area), so the picture comes back with the stage's proportions and fills it.
  It changes the tab for everyone watching, so nothing is sent on connect or on
  a mode change. The button shows on (`body.fit-on`, `aria-pressed`) only when
  the host answers `{ t:'fit', on:true }`; `{ t:'fit', on:false }` (another
  guest took the tab, or the share went view-only) and a new connection switch
  it off. While on, the tab follows this window: the size is sent again 200 ms
  after a resize settles, except while the on-screen keyboard is open, so a
  browser that shrinks the page for the keyboard does not make the site reflow
  on every tap into a field. Pressing it again sends `{ t:'size', off:true }`.
  The button drops focus on every press, so a Space or Enter typed for the
  shared tab never toggles it.
- Optimised stream: when offered and `RTCPeerConnection` exists it asks for a
  peer (two attempts), plays the `<video>` and tells the host to stop JPEG
  frames; a failed or dropped peer falls back to frames.
