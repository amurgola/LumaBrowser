# HubWidgetBase

`extensions/personal-hub/ui/widgets/HubWidgetBase.js`

Base class of the Hub's Dashboard widgets: injects the shared styles, renders
the widget shell, loads and paints data, and reloads (debounced) on the Hub
events the subclass names. Only the newest load paints, so a slow earlier one
never lands on top of it. A widget naming a `TICK_MS` is also woken on that
interval, for what changes with the clock alone. Errors paint inline and
never throw.

## Contract with the Dashboard

A widget module's default export is the class, whose static
`mount(root, host)` returns the dispose function. `host` is
`{ extensionId, call(method, ...args), onEvent(cb) -> detach, openTab(url),
openChat() }`; `call` resolves the Hub API result or throws.

## Methods

- `new HubWidgetBase(root, host)`.
- `mount()`: [HubWidgetStyles.ensure](HubWidgetStyles.md), adds `hub-widget`
  to the root, `_renderShell()`, subscribes to `host.onEvent`, starts the
  tick, first `refresh()`; returns `() => dispose()`.
- `refresh()`: `_load()` then `_paint()`; a throw goes to the `.hub-error`
  line, a success clears it. When loads overlap, only the one started last
  (`_loadSeq`) paints or reports its error; an older, slower reply is dropped
  instead of overwriting newer data.
- `act(fn)`: runs a host call and refreshes; reports a throw.
- `dispose()`: detaches the subscription, cancels a pending reload and stops
  the tick.
- Subclasses may declare `ATTENTION_AREA` (`'calendar'`, `'queue'` or
  `'tasks'`): a `.hub-attention` strip is inserted right after `.hub-head`
  and filled on every refresh and on `connection.changed` from
  `listConnections`, with the connections of that area that need attention
  (red) or whose tab is gone (amber); `Sign in` calls `showConnectionTab(key)`.
  Agenda uses `calendar`, the activity feed `queue`, the board `tasks`.
- Subclasses may declare `static TICK_MS` (default 0, off): above zero,
  `_tick()` runs that often while the widget is mounted (relative times,
  overdue dates, a new day). The default `_tick()` paints the loaded data
  again; a subclass may reload instead (the activity widget does). A throw
  from it goes to the error line.
- Subclasses declare `REFRESH_EVENTS` and implement `_renderShell()`,
  `_load()` and `_paint()`. Helpers: `_errorLine()`, `_empty(text)`,
  `_openUrl(url)`.

A burst of matching events (a sync touching many rows) reloads once, 250 ms
after the last.
