# Dashboard renderer

`core/dashboard/ui/` (page: `dashboard.html`, served at `/dashboard-ui/dashboard.html`)

The Dashboard tab: a GridStack 12-column grid of live-artifact widgets plus a
dock listing every live module. Start with [DashboardPage](js/DashboardPage.md).

## Loading

`dashboard.html` links the LLM tab's `/llm-ui/css/base.css`,
`luma-components.css` and `live-module.css`, GridStack's CSS, then the four
page stylesheets in order (`css/dashboard-page.css`, `dashboard-dock.css`,
`dashboard-cards.css`, `dashboard-tasks.css`, split from legacy
`css/dashboard.css` with identical rules). Classic scripts `/llm-ui/resonant.js`
and `/dashboard-ui/lib/gridstack/gridstack-all.js` run first, then the module
`js/entry.js`.

The modules import `core/llm-server/ui/js/...` by relative file path, which the
browser resolves to `/llm-server/ui/...`. The page carries an import map
`{ "imports": { "/llm-server/ui/": "/llm-ui/" } }` so those URLs reach the
gateway's `/llm-ui/` mount; no gateway route is needed. A test resolves every
import through the map against the gateway mounts.

## Classes

| Class | Role |
|---|---|
| [DashboardPage](js/DashboardPage.md) | builds, wires and restores the page |
| [DashboardGrid](js/DashboardGrid.md) | the GridStack wrapper |
| [WidgetCatalog](js/WidgetCatalog.md) | the live-module listing and hidden set |
| [WidgetDock](js/WidgetDock.md) | the dock rail |
| [WidgetCards](js/WidgetCards.md) | card and tombstone builders |
| [WidgetMounts](js/WidgetMounts.md) | mounting live modules and extension widgets into cards |
| [ExtensionWidgetMount](js/ExtensionWidgetMount.md), [ExtensionWidgetHost](js/ExtensionWidgetHost.md) | importing an extension's widget module and the host it receives |
| [LayoutSaver](js/LayoutSaver.md) | debounced layout persistence |
| [DashboardMode](js/DashboardMode.md) | Live and Edit modes |
| [FatalNotice](js/FatalNotice.md) | the "Dashboard unavailable" page |
| [DashboardTasks](js/tasks/DashboardTasks.md) | scheduled-task facade |
| [TaskPanel](js/tasks/TaskPanel.md), [TaskForm](js/tasks/TaskForm.md), [TaskHistory](js/tasks/TaskHistory.md), [TaskBadges](js/tasks/TaskBadges.md), [DashboardModal](js/tasks/DashboardModal.md) | the schedule UI |

## Globals

Read: `window.dashboardAPI` (preload), `window.GridStack` (vendor),
`window.location`; `window.Resonant` through the shared mounter. Written: none.
