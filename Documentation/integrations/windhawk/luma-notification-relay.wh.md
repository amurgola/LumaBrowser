# luma-notification-relay

`integrations/windhawk/luma-notification-relay.wh.cpp`

Windhawk mod (id `luma-notification-relay`, `@include explorer.exe`,
`@architecture x86-64` and `arm64`, `@compilerOptions -lwinhttp -lole32 -loleaut32 -lruntimeobject`)
that sends every toast Windows shows to the
[notifications feature](../../extensions/desktop-integration/features/notifications/index.md)
(`POST /api/desktop/notifications/`). Embeds
[luma_client](_shared/luma_client.inc.md) verbatim; `X-Luma-Client:
windhawk-luma-notification-relay/1.0`.

## Approach

It reads the Action Center through the public WinRT
`UserNotificationListener` (`GetNotificationsAsync(NotificationKinds::Toast)`).
That API works from an unpackaged desktop process when Windows' "Let desktop
apps access your notifications" privacy switch is on (checked on this machine
from plain PowerShell: `GetAccessStatus` = Allowed, toasts readable with app
name, AUMID and text). It hooks nothing.

Alternatives considered:

- Hooking the toast renderer (ShellExperienceHost / the XAML toast UI): the
  internals change between Windows builds, the content is XAML not toast XML,
  and a mistake crashes the shell. Rejected.
- Reading `%LOCALAPPDATA%\Microsoft\Windows\Notifications\wpndatabase.db`
  (SQLite in WAL mode, through `winsqlite3.dll`): carries the raw toast XML,
  tag, group and launch arguments, but the schema is undocumented and has
  changed across builds, and reading a live WAL database owned by
  WpnUserService needs care. Kept as a possible richer source; Luma itself
  could read that store directly (no Windhawk) if tag/group/launch args are
  ever needed.

## Runtime

- `Wh_ModInit` loads settings and starts one worker thread. The thread waits on
  the named mutex `Local\LumaBrowser.NotificationRelay`, so only one Explorer
  process per session relays (another takes over if it exits).
- It initializes an MTA apartment, checks `GetAccessStatus` (logs once and
  rechecks every minute while access is off; never calls `RequestAccessAsync`
  and never changes settings), then tries `NotificationChanged`. That event is
  not delivered to unpackaged processes (it throws), so in practice the thread
  polls every `pollIntervalMs` (default 2000). With events it would poll every
  30 s as a safety net.
- Each scan compares toast ids with the previous scan; new ones are turned
  into `{ app, appId, title, body, lines, at, osId }` (first text element is
  the title, the rest the body) and posted in batches of 50 with the blocking
  `luma::Post` on the worker thread. Toasts present at start are only marked
  seen (unless `sendExisting`). When `luma::HasFeature("notifications")` is
  false (Luma not running, feature off) or the post fails, the batch is
  dropped; ids are still marked seen, so nothing floods in later.
- WinRT calls are bounded (`wait_for` 5 s). `Wh_ModUninit` signals the stop
  event, calls `luma::Shutdown()` and joins the thread (10 s).

## Settings

| Key | Default | What |
| --- | --- | --- |
| `excludedApps` | `[""]` | display names or AUMIDs never sent; case-insensitive, `*` wildcard |
| `includeText` | true | off: title `New notification`, no body or lines |
| `sendExisting` | false | also send the toasts in the Action Center at start |
| `pollIntervalMs` | 2000 | 500 to 60000 |
| `apiKey` | '' | only when Luma's Settings > API requires a key |

## Limits

- Only toasts that reach the Action Center are seen; a popup-only toast or one
  dismissed between two polls is missed.
- The listener API does not expose tag, group, launch arguments or images, so
  those fields are not sent.
