# CommandForwarder

`extensions/cdp-driver/domains/CommandForwarder.js`

Passes every command the server does not answer itself straight to Chromium through
the [DebuggerProxy](../DebuggerProxy.md), so the rest of the protocol works for free.

## Methods

- `new CommandForwarder(server)`.
- `forward(method, params, session)`: no session -> `-32601 '<method>' requires a session; attach to a target first`;
  a session whose target is gone -> `-32603`; a Chromium failure -> `-32000` with its message.
