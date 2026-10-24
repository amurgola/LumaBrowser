# luma-link-redirect

`integrations/windhawk/luma-link-redirect.wh.cpp`

A Windhawk mod (id `luma-link-redirect`, `@architecture x86-64`,
`@compilerOptions -lwinhttp -lole32`) that sends the links Windows forces into
Microsoft Edge to Luma's [open feature](../../extensions/desktop-integration/features/open/index.md):
Start menu web results (Bing searches), widgets and news links (MSN), and any
other `microsoft-edge:` link. It embeds [luma_client](_shared/luma_client.inc.md)
verbatim and is an ordinary client of the generic `POST /api/desktop/open/`.

## Processes

`@include`: `explorer.exe`, `SearchHost.exe` (Start menu search on Windows 11),
`SearchApp.exe` (older builds), `StartMenuExperienceHost.exe`,
`ShellExperienceHost.exe`, `Widgets.exe`, `WidgetService.exe`, `sihost.exe`,
`RuntimeBroker.exe`. The `processes` setting narrows the ones it acts in (the
hooks stay installed but pass everything through elsewhere).

Why several: on Windows 11 the search and widgets surfaces open web results
with `Launcher.LaunchUriAsync("microsoft-edge:?url=...")`; Windows resolves
`microsoft-edge:` to its registered handler
`"...\msedge.exe" --single-argument %1` and starts it either in the calling
process (through `ShellExecuteExW`/`CreateProcessW`) or in a broker process.
Which process does the `CreateProcess` on 24H2 (build 26100) was not observed
yet (see Live testing); the list covers the caller and the likely brokers.

## Hooks

- `ShellExecuteExW`, `ShellExecuteW` (shell32): an `open` (or default) verb on
  a `microsoft-edge:` file, or on `msedge.exe` with a link in its parameters.
  A skipped call reports success (`hInstApp` 42, `hProcess` null).
- `CreateProcessW`, `CreateProcessAsUserW` (kernelbase): an `msedge.exe` image
  with a link in its arguments. A skipped call fails with `ERROR_CANCELLED`
  (what shell callers treat as "the user canceled": no error dialog). Faking
  success was ruled out: the caller would get process handles it may wait on.

Edge-bound means `--single-argument <link>` (the protocol-activation form) or
a lone link with no switches. `msedge.exe` with any switch (a profile, an app
or PWA window, InPrivate) or without a link is the user starting Edge and is
never touched; nor is any non-Edge launch.

## Flow

1. The hook unwraps the link with a C++ mirror of
   [LinkUnwrap](../../extensions/desktop-integration/features/open/LinkUnwrap.md)
   and decides by the settings: a Bing search -> `{ "query" }` (searchMode
   `luma`), `{ "url": <bing url>, "unwrap": false }` (`bing`), or left to Edge
   (`edge`); an MSN link -> `{ "url" }` if `redirectNews`; any other link ->
   `{ "url" }` if `redirectOtherLinks`.
2. Only if `luma::HasFeature("open")` (the handshake exists, Luma's pid is
   alive and `open` is listed; a file stat, no network) does it skip the
   launch. It calls `luma::AllowForeground()` (the clicking process owns the
   foreground) and queues `POST /open/` with `luma::PostAsync`.
3. The hooked call returns at once; **it never waits on the network**, so the
   shell cannot hang. If Luma then does not answer `success: true` (an error,
   401, a timeout of `timeoutMs`, default 2500 ms), the pool thread replays the
   original launch (`ShellExecuteExW` with the same verb, file, parameters,
   directory and show command; or `CreateProcessW` with the same application,
   command line, directory and flags, minus suspended/extended-startup/custom
   environment) with a thread-local guard so the hooks let it through. The
   same request body is not redirected again for 15 s, in case the replay
   reaches a hook on another thread.

Optimistic skip plus replay was chosen over a synchronous request in the hook:
the hooked calls often run on UI threads (Explorer, the Start menu), and the
replay keeps the rule "suppress only if Luma accepted" in effect, a moment
later instead of up front.

## Settings

| Key | Default | What |
| --- | --- | --- |
| `searchMode` | `luma` | `luma`: search with Luma's engine; `bing`: open the Bing page in Luma; `edge`: leave searches to Edge |
| `redirectNews` | true | MSN / Microsoft Start (widgets, news) links |
| `redirectOtherLinks` | true | any other Edge-forced link |
| `processes` | all included | comma-separated process names to act in; empty = all |
| `verboseLog` | false | also log Edge launches it let through |
| `apiKey` | empty | only when Luma's Settings > API requires a key |
| `timeoutMs` | 2500 | 500 to 10000 |

`X-Luma-Client: windhawk-luma-link-redirect/1.0`. `Wh_ModUninit` stops acting
and calls `luma::Shutdown()` (a request still in flight at that moment is
dropped without a replay).

## Known limits

- The right-hand preview pane of Start search is Bing content rendered inside
  SearchHost; only clicks that leave it are caught.
- When Luma is up but slow or refuses a link, the Edge launch happens up to
  `timeoutMs` late.
- A broker process outside the include list would bypass the mod; turn on
  `verboseLog` to see which process and hook catch a link.
- x86-64 only (the shell processes are 64-bit; ARM64 Windows is not covered).

## Live testing (needs the user)

Install from Windhawk, enable Debug logging, then with Luma running: click a
web result in Start search, a news card and the weather in the widgets board,
and a `microsoft-edge:https://example.com` link from Win+R. Check the log line
`[<hook>] opened in Luma: ...` and which process logged it (narrow `processes`
to it afterwards if wanted). Then quit Luma and repeat: Edge must open as
before. Also check that starting Edge itself, an Edge PWA and ordinary
programs are unaffected.
