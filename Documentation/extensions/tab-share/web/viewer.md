# viewer.html, viewer.css, viewer.js (tab-share)

`extensions/tab-share/web/viewer.html`, `viewer.css`, `viewer.js`

The page a guest opens from a `/tab/<token>` link, served by
[TabShareWebRouter](../TabShareWebRouter.md) (`/tab/:token` sends
`viewer.html`, `/tab/assets/*` serves this folder). It runs in the guest's
own browser with no preload. Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts, and the build obfuscates it as one file). (`manifest.browserScripts` names
`./web/viewer.js` for the browser obfuscation target.)

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
- Optimised stream: when offered and `RTCPeerConnection` exists it asks for a
  peer (two attempts), plays the `<video>` and tells the host to stop JPEG
  frames; a failed or dropped peer falls back to frames.
