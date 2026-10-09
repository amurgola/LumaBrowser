# CalendarSourceRepository

`extensions/personal-hub/calendar/CalendarSourceRepository.js`

`hub_calendar_sources` as a [SyncSourceRepository](../sync/SyncSourceRepository.md)
(with the `color` column): the user's calendar feeds (ICS, Google, Microsoft)
and their sync state. Secrets never live in `config`; they are in the secrets
store under `hub:cal:<id>:*`.
