# capturer-preload.js (tab-share)

`extensions/tab-share/rtc/capturer-preload.js`

Preload of the hidden capturer window. Stays one CommonJS file that requires
only `electron` (preload rule). Exposes `window.tabShareRtc = { send(msg),
on(fn) }` over the `ext.tab-share.rtc` channel ([CapturerWindow](../CapturerWindow.md)`.CHANNEL`),
nothing else.
