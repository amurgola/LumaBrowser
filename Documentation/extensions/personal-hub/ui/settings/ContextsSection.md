# ContextsSection

`extensions/personal-hub/ui/settings/ContextsSection.js`

The Hub's contexts section: the few companies or areas of life
everything is filed under. Each context has a name and a colour and says
what belongs to it: signed-in tabs, calendars and task trackers (ticked from
what the Hub already knows), plus mail or site domains, parts of a link and
whole apps (typed). The set is saved as one; activity summaries and the
focus view group by it ([ContextService](../../context/ContextService.md)).
Shown in Settings > Hub and in the Dashboard's settings panel
([HubSettingsPanel](../widgets/HubSettingsPanel.md)), so it imports only
from the extension's own ui folder (`WidgetDom.esc` for escaping; see
[HubSection](HubSection.md)).

## Behaviour

- One block per context: a colour picker (a new block takes the next
  `PALETTE` colour), the name, Up / Down (disabled at the ends), Remove.
  `Add context` appends a blank block and focuses its name.
- Three rows of tick boxes, each a rule kind: `Tabs` (`partition`, one box
  per signed-in tab session), `Calendars` (`calendar`) and `Trackers`
  (`tasks`), from `listContextChoices`. A saved value whose choice is gone
  (a closed tab) stays listed as `<value> (not open)`, so a save does not
  silently drop it. A row with nothing to tick says so (`No signed-in tabs
  found yet.` and the like); a failed read of the choices leaves the rows
  empty.
- Three typed rows (`TYPED`), comma separated: `Domains` (`domain`: mail
  from these domains and notifications from these sites), `Link contains`
  (`url`: a workspace or team id that shows in the address of its tab) and
  `Whole apps` (`app`: everything from an app).
- The help text states the precedence: a link match wins, then the tab, then
  the domain, then the app; anything that matches no context lands in
  Other.
- Add, reorder and remove read the blocks back first, so edits survive the
  re-render.
- `Save contexts` sends `saveContexts([{ id?, name, color, rules }])` in
  display order; blocks left without a name are dropped rather than refused.

## Methods

- `new ContextsSection(tab)` (see [HubSection](HubSection.md)).

## IPC

`listContexts`, `listContextChoices`, `saveContexts(contexts)`.
