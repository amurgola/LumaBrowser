# renderer.js (tab-share)

`extensions/tab-share/renderer.js`

Classic-script exception: the extension is `distributable: true`, so this stays one self-contained classic file (add-on scripts are injected as classic scripts, and the build obfuscates it as one file).

The Tab Share main-window renderer, `window.__ext_tab_share = { activate,
deactivate, _instance }` (`_instance` is the e2e harness hook). Three surfaces:

1. a tab-strip context-menu contribution
   (`window.registerTabMenuContributor`): "Share tab" when sharing is
   available, else for a shared tab "Sharing tab" (checked, with the watcher
   count or mode) and "Stop sharing tab";
2. the share dialog (`.lm-overlay`): View only / View and interact, Create
   link, the link with Copy, the watcher line and dot, Stop sharing / Done;
   changing the mode of a live share calls `setMode`; Escape or a backdrop
   click closes;
3. the share flag on shared live tabs in the strip (`.ext-ts-shared` plus an
   SVG in `.tab-flags`) and the settings page (`settings.html`): the
   availability line, the share list (mode select, Copy link, Open tab, Stop),
   Stop all (confirmed), and the autosaved streaming settings (WebRTC, TURN
   relay, port, host) with their status lines.

All state comes from `ext.tab-share.status` and the `ext.tab-share.changed`
push; every `tab:state` push re-applies the flags.

## IPC

Invokes `ext.tab-share.status`, `share(tabId, mode)`, `setMode(shareId, mode)`,
`stop(shareId)`, `stopAll`, `updateSettings(patch)`; listens on
`ext.tab-share.changed` and `tab:state`.

## Globals

Writes `window.__ext_tab_share`. Reads `window.LumaExtUI` (injecting
`extensions/ext-ui.js` when missing), `window.registerTabMenuContributor`,
`window.tabAPI`, `navigator.clipboard`. Injects `<style id="ext-ts-style">`.
