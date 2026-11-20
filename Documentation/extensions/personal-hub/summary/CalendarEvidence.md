# CalendarEvidence

`extensions/personal-hub/summary/CalendarEvidence.js`

Finds the meetings already on the user's calendar that bear on an activity
item: one with the item's subject, or (for a mail or a direct message) one
with just the person who wrote. A summary reads them to tell that a question
about when to meet has been settled, so a booked meeting stops being
reported as someone waiting ([ActivitySummarizer](ActivitySummarizer.md),
[SummaryPrompt](SummaryPrompt.md)).

## Methods

- `new CalendarEvidence({ calendar, now? })`: `calendar` a
  [CalendarService](../calendar/CalendarService.md) (only `listEvents` is
  used), `now()` a Date (default the clock).
- `forItems(items)` -> `{ <itemId>: [{ id, title, startsAt, endsAt, allDay,
  attendees, organizer }] }` for the items that have a coming meeting, the
  soonest first, at most `PER_ITEM` = 3 each. `items` are feed items
  (`{ id, app, title, participants, lastNotification }`). `attendees` is
  each attendee's name, else address; an item with no meeting is absent.
- `static bearsOn(event, item)`: whether a meeting is about an item. The
  subjects match when both normalise to the same text
  ([ThreadKey](../inbox/ThreadKey.md)`.normalize`, so `RE:` and bracketed
  tags do not matter) and the item's is at least `MIN_SUBJECT` = 4
  characters. Otherwise the item must be direct
  ([ActivityKind](../inbox/ActivityKind.md)`.isDirect`, with the last
  notification's sender), the meeting must have at most `WITH_SENDER_MAX` =
  2 attendees, and one of them must be the sender (`isPerson`).
- `static isPerson(attendee, sender)`: whether an attendee (`{ name, email
  }`) is the person a sender names. True when the sender text carries the
  attendee's address, when the attendee's name equals the sender's name, or
  when the part of the address before the `@`, letters only, is the first
  and last words of the name put together one of four ways (`danareyes`,
  `dreyes`, `reyesdana`, `danar`). A sender of one word matches only by
  address.

## Reading the calendar

`_coming()` asks `calendar.listEvents({ from: now, to: now + DAYS_AHEAD })`
(`DAYS_AHEAD` = 14 days), leaves out events whose status is `cancelled` or
whose title starts with `cancel` (`CANCELLED`, which is how a cancelled
Microsoft event is titled), and sorts by start. A calendar that cannot be
read gives no meetings.

## Why

A notification asking "tomorrow or Monday?" keeps reading as someone waiting
until the mail thread says otherwise, and the Hub rarely sees the reply. The
calendar does see the outcome: the meeting. The subject is the strong
signal, since a meeting made from a mail carries its subject. The person
alone is weak, because a standing meeting the sender also attends says
nothing about what they wrote, so it counts only for a meeting that is
theirs and the user's alone, and only for an item that is directly from
them.
