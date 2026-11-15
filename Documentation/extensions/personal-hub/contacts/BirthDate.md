# BirthDate

`extensions/personal-hub/contacts/BirthDate.js`

A birth date as people give it, with a year or without one. Reads the forms
a person or a model writes into one stored form, and words the date, the
age and how soon the next birthday comes. Used by
[ContactProfile](ContactProfile.md) for a person's `birthday` field.

## Stored forms

- `1992-10-31`: with a year.
- `--10-31`: month and day, the year unknown.

## Methods (static)

- `parse(text, { now = new Date() })` -> the stored form, or `''` for empty
  text (no birth date). Before reading, the text is lower-cased, ordinal
  endings (`st`, `nd`, `rd`, `th` after a digit) and commas are dropped and
  spaces are single. Read forms: `1992-10-31`, `10-31` or `--10-31`,
  `10/31` and `10/31/1992` (US month first), and a named month by three
  letters or more, month first or day first, the year optional
  (`October 31st, 1992`, `31 Oct 1992`, `Oct 31`). The day must exist (29
  February counts when the year is unknown or a leap year), the year must
  not be before `EARLIEST_YEAR` = 1900 and the date not ahead of `now`.
  Anything else throws `"<text>" does not read as a birth date. Try
  1992-10-31, October 31 1992, or 10-31 when the year is unknown.` (the
  second sentence is `HINT`).
- `describe(value, { now = new Date() })` -> `born 31 October 1992 (age
  34)`, or `birthday 31 October` without a year, followed by `, birthday
  today` on the day or `, birthday in 5 days` (`1 day`) when it is at most
  `SOON_DAYS` = 14 days away. `''` for a value that is not a stored form.
- `age(value, now = new Date())` -> full years lived, or `null` when the
  year is unknown or the value is not a stored form.
- `daysUntil(value, now = new Date())` -> days from today to the next
  birthday (0 on the day), or `null` for no date. Counted between local
  midnights.

## Why

People often know a birthday without the year, so the year is optional and
the stored form says so (`--`, as in ISO 8601's month-day form). One stored
form means the assistant and the settings form read the same thing whatever
the user or a model typed, and a date that cannot be real is refused at the
door instead of being stored.
