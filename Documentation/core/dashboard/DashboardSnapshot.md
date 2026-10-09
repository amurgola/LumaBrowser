# DashboardSnapshot

`core/dashboard/DashboardSnapshot.js`

The Dashboard as text for the chat: what `@dashboard` (or `/dashboard`) in
the composer attaches. Every widget placed on the grid becomes one markdown
section, in reading order (top to bottom, then left to right).

## Methods

- `new DashboardSnapshot({ dashboardService, getAgentDeps, getExtensionManager, now })`:
  the layout comes from [DashboardService](DashboardService.md)`.getLayout`;
  the agent deps (lazy, they exist once the browser booted) supply
  `artifactStore` and `artifactDataStore`; the extension manager (lazy) the
  active extensions; `now()` a Date for the header.
- `async read()` -> `{ title: 'Dashboard', text, chars, truncated, at, widgets }`
  or `{ success: false, error }`:
  - `The Dashboard is not available.` without a dashboard service;
    `The Dashboard has no widgets yet. Open it and place a widget first.` when
    the layout is empty or names only tombstones (root ids neither an active
    extension widget nor a live chain).
  - `text` starts with `# Dashboard`, a `Captured <local date time (UTC+hh:mm)>`
    line naming the widgets, then `## <title>` + body per widget.
  - An extension widget (`ext:<id>:<widget>`) whose manifest entry names a
    `context` method is read through
    [ExtensionApiCall](../shell/extensions/ExtensionApiCall.md)`.invokeWidgetContext`
    with `{ widgetId, rootId, title }`; a string result is the body, an object
    `{ text, title? }` may retitle the section, anything else is `(No saved
    data.)`. A refusal or throw becomes `(This widget could not be read: <error>)`
    and the widget's `error`. A widget without a `context` reads
    `(This widget does not share its data with the chat.)`.
  - A pinned live module is its chain title (`Untitled widget` when blank) and
    its saved state from `artifactDataStore.all(rootId)` as pretty JSON under
    `Saved state (JSON):`, or `(No saved data.)`.
  - Each body is capped at 24,000 characters (then
    `[This widget had more; only the beginning is included.]`) and the whole
    text at 60,000 (`truncated: true`, `chars` the full length), the same
    budget as a read page.
  - `widgets`: `[{ rootId, title, kind: 'extension' | 'live', chars, error? }]`.

## Why

The widgets already compute what the user looks at; the model should see the
same thing rather than re-query every source. Extensions decide what their
widget shares by naming a method (the Hub's `widgetContext`), so the snapshot
stays generic and the allow-list stays in the manifest.

Read by [PageContextActions](../llm-server/ipc/PageContextActions.md)`.readDashboard`;
the Hub's sections come from [HubContext](../../extensions/personal-hub/HubContext.md).
