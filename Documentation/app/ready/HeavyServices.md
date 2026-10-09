# HeavyServices

`app/ready/HeavyServices.js`

The heavy half of startup, exposed by [WindowServices](../browser/WindowServices.md)
and run by [DeferredServices](DeferredServices.md).

## Methods

- `new HeavyServices(ctx, { browserService, log? })`.
- `run()`:
  1. With the API on, `restGateway.start()` (not awaited). Once listening:
     log `REST API server running on http://localhost:<port>`, write the CLI
     handshake, refresh an installed `luma` launcher, JetBrains plugin and VS
     Code extension (never a fresh install; each best-effort; skipped entirely
     when `ctx.isolatedDataDir`, so a custom `LUMA_DATA_DIR` run never rewrites
     the user's real installs), and
     `notifyGatewayReady()` on the LLM server and the dashboard so a tab that
     failed its http load before the gateway listened reloads. A start failure
     logs `Failed to start REST server:`. With the API off, log
     `REST API server is disabled via settings`.
  2. `await extensionManager.activate()` (a failure logs `Extension activation error:`).
  3. `ctx.agentDeps` = [AgentDeps](AgentDeps.md)`.build(...)`.
  4. Start the artifact-task and scheduled-task schedulers; reconcile the
     folder watches; subscribe the page-change and notification sources.
