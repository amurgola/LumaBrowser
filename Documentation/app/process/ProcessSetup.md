# ProcessSetup

`app/process/ProcessSetup.js`

Process configuration that precedes everything else.

## Methods

- `new ProcessSetup(ctx, { crashTracer?, debugLog?, log? })`; the first two
  default to the [CrashTracer](../../core/diagnostics/CrashTracer.md) and
  [DebugLog](../../core/DebugLog.md) statics.
- `run()` false when another instance holds the lock (`app.exit(0)` was called).
  In order:
  1. `LUMA_DATA_DIR` sets `userData` (the Chromium profile and the instance lock
     live there too); `ctx.dataDir` is it, else `userData`;
  2. the crash journal, before the lock so even that exit is recorded;
  3. the single-instance lock; `second-instance` restores, shows and focuses the
     running window;
  4. dev only: the console ring buffer behind the chat's "Copy Logs";
  5. [UnhandledRejectionTap](UnhandledRejectionTap.md);
  6. `app.userAgentFallback = ChromeIdentity.USER_AGENT` (service workers read it);
  7. Chromium switches: `enable-features=UseSkiaRenderer`,
     `force-color-profile=srgb`, `disable-features=CalculateNativeWinOcclusion`,
     and on Linux `enable-transparent-visuals`.
