# GuestTargetGuard

`core/llm-server/chat/bridge/tools/GuestTargetGuard.js`

What on the host computer an agent running for a paired Network Sharing client
must not reach. [ToolDispatch](ToolDispatch.md) asks it before every tool call
of a run whose context has `forGuest` (set by
[ProxyTurns](../../router/ProxyTurns.md)). The host's own chats and unattended
runs (timed tasks, triggers) are never checked.

## Methods

- `async GuestTargetGuard.refusal(params, browserService, host?)` returns `null`
  when the call may run, else the reason:
  - `URL_REFUSED` when `params.url` is host-private, whichever tool carries it
    (`navigate`, `create_tab`, `send_webhook`, an extension tool).
  - `TAB_REFUSED` when `params.tabId` names a tab whose current address is
    host-private (looked up with `browserService.getTabs({ includeSilent: true })`).
    An unknown tab, or a browser that cannot list tabs, passes.
- `GuestTargetGuard.isHostPrivate(url, host?)`: the address is read the way the
  tab loader reads it ([TabUrl](../../../../browser/TabUrl.md)`.normalize`), then:
  - `about:` is harmless (a work tab starts blank);
  - any scheme other than http(s) is private: `file:`, `luma:`, `chrome:`,
    `view-source:`, `javascript:`, `data:`, a bare Windows path;
  - an http(s) address is private when its host is this computer: `localhost`,
    `*.localhost`, a loopback address, `0.0.0.0` or `::`, one of this computer's
    own interface addresses, or its own name (with or without `.local`).

  `host` is `{ names, addresses }` and defaults to what `os.hostname()` and
  `os.networkInterfaces()` report.

## Why

A paired client's agent has the host's browser. Without this it could open
`file:///C:/Users/<you>/.ssh/id_rsa` and read it back, read the host's local
API, post to `http://127.0.0.1:3000/api/mcp/call` with `send_webhook` when the
host shared that tool, or type into the host's own `luma://terminal` tab.

The check is on the address a call names and on the tab it targets, so it also
covers a host page reached indirectly: a tab the host user left open, or one a
page opened by itself. Other machines on the host's network (a router page, a
NAS) stay reachable; the guard is about this computer only.

Addresses written as numbers (`http://2130706433/`, `http://0x7f.0.0.1/`) are
caught because the URL parser turns them into dotted form first.
