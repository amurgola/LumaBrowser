# IdentityOverride

`core/browser/identity/IdentityOverride.js`

Makes Chromium itself report the spoofed identity for one WebContents, over its DevTools debugger.

## Methods

- `IdentityOverride.apply(wc, { autoAttach = true })`. Skips a missing,
  destroyed or debugger-less WebContents. Attaches the debugger (`1.3`) unless
  already attached, then sends, without awaiting:
  - page and cross-site iframe targets: `Emulation.setUserAgentOverride`,
    `Page.enable`, `Page.addScriptToEvaluateOnNewDocument`
    ([ChromeObjectShim](../ChromeObjectShim.md) + [PasskeyShim](../PasskeyShim.md));
  - worker targets: `Network.setUserAgentOverride`;
  - then `Target.setAutoAttach` (`waitForDebuggerOnStart: false`, `flatten: true`)
    when auto-attaching, and `Runtime.runIfWaitingForDebugger` last for a target
    someone else paused.
  Listeners go on once per WebContents; calling again re-installs the root setup.

`autoAttach: false` is for tabs an external CDP client drives: only the root is
overridden, child targets are left to the client.

## Behaviour

- Child targets (OOPIFs, workers) announced by `Target.attachedToTarget` get
  the same setup on their session.
- If the debugger detaches while the tab lives (the CDP driver shutting down,
  a diagnostics tool), the override is re-installed on the next tick; a
  destroyed tab is left alone.
- Command failures for closed or detached sessions are silent; others are
  warned with a `[chromeIdentity]` prefix.

## Why

Patching `navigator` from page JS leaves own properties with non-native
getters, which bot detectors (browserscan's "Native Navigator") flag. The
Emulation domain makes the native getters return the spoofed values and
generates Sec-CH-UA from the same metadata. It must run before the first
`loadURL`; attach and `sendCommand` dispatch synchronously, so not awaiting is
enough. Targets are not paused at start because Electron's debugger never
resumes a paused cross-site iframe.
