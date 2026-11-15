# TerminalView

`ui/terminal/TerminalView.js`

One terminal on screen: an xterm.js terminal fitted to its container and wired to a session through a transport. The
terminal tab's page and the window's dock both use it; each brings its own transport and its own xterm classes.

- **Joining.** The screen so far is replayed, then output follows live. Output that arrives before the join reply
  waits behind the replay.
- **Flow.** Each drawn chunk is acknowledged, which is what lets the host pause a shell that outruns the view.
- **Exit.** The view says the process exited; Enter starts it again (same profile, same folder).
- **Keys.** Ctrl+C copies when text is selected and interrupts otherwise; Ctrl+Shift+C always copies; Ctrl+V and
  Ctrl+Shift+V are left to the browser, whose paste xterm turns into input.
- **Look.** One palette, `TerminalView.PALETTE`, whatever the system prefers: the app is dark, and a terminal that
  turned white under a light system setting would be the one bright surface in it. Its named slots are the app's
  tokens (`tokens.css`: `--bg-root`, `--text-primary`, `--accent`, the status colours) and the luma CLI's dark palette
  (`cli/lib/tui/theme/ThemePalettes.js`: text, accent, good, warn, bad, info, muted, selectedBg), and a test holds the
  three together. `settings.background` replaces only the background, so the dock's terminal sits flush on the dock.

Transport: `{ attach(size), restart(size), input(data), resize(cols, rows), ack(chars), onEvent(listener) }`.

## Methods

- `new TerminalView(container, { xterm: { Terminal, FitAddon }, transport, settings, hooks })`; hooks `onSession`,
  `onExit`, `onClosed`.
- `start()`, `focus()`, `dispose()`.

A session with `failedToStart` shows "The shell could not be started. Press Enter to try again." instead of an exit code.
