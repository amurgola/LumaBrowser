# DownloadGroups

`ui/downloads/DownloadGroups.js`

The downloads page's list as it is read: the downloads that match the search, newest first, under the day each one
started.

- A download matches when the search text is part of the name it was saved under, its suggested name, or the address
  it came from; case does not matter.
- Days go by the calendar, not by 24 hours: "Today", "Yesterday", then the full date in the system's wording. A
  record with no start time is listed under "Earlier".

## Methods

- `DownloadGroups.build(list, { query, now, locale })` -> `[{ label, downloads }]`, newest day first.
- `DownloadGroups.matches(download, query)`.
- `DownloadGroups.dayLabel(startedAt, now, locale)`.

## Globals

None.
