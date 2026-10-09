# capturer.html, capturer.js (tab-share)

`extensions/tab-share/rtc/capturer.html`, `extensions/tab-share/rtc/capturer.js`

The hidden capturer page [CapturerWindow](../CapturerWindow.md) loads by path
(protocol in [RtcCapturer](../RtcCapturer.md)). Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts, and the build obfuscates it as one file). The page CSP
allows only `'self'` scripts and `blob:` media.

## Behaviour

One captured `MediaStream` per shared tab (asks main to grant the tab, then
`getDisplayMedia` capped at 1920x1200 and 30 fps, `contentHint = 'detail'`)
and one `RTCPeerConnection` per guest (6 Mbit/s cap), negotiated over the
`window.tabShareRtc` pipe; streams are released when their last peer goes or
the track ends.

## Globals

Reads `window.tabShareRtc` ([capturer-preload.js](capturer-preload.md)).
