# HubAgendaWidget

`extensions/personal-hub/ui/widgets/HubAgendaWidget.js`

The Hub's agenda widget (`manifest.dashboard.widgets` id `agenda`): the next
day or week of events across every calendar source, grouped by day with
all-day events first, a source colour bar per row and a `now` marker inside
today. Extends [HubWidgetBase](HubWidgetBase.md); reloads on
`calendar.synced` and `calendar.changed`.

## Behaviour

- The head shows today's date and a `Today` / `Week` toggle (`days` 1 or 7);
  switching reloads `listEvents({ days })`.
- Events group by local day ([WidgetDom.dayKey](WidgetDom.md)); within a day
  all-day events come first, then by start. Rows: the source colour bar,
  the time range (`All day` or `09:30 to 10:00`), the title, and location and
  source label as the sub line. Past timed events are dimmed (`is-past`).
- Inside today the `now` line sits before the first event that starts in the
  future (after every event when none does).
- A row with a `url` opens it through `host.openTab`.
- Empty states: `Nothing on the calendar today.` / `... this week.`; with no
  calendar source at all (asked of `listCalendarSources` only when the window
  is empty) it points to Settings > Hub > Connections instead (`NO_CALENDARS`).
- `ATTENTION_AREA` `calendar`: the strip under the head lists signed-out
  calendar tabs (see [HubWidgetBase](HubWidgetBase.md)).
