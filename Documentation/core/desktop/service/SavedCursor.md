# SavedCursor

`core/desktop/service/SavedCursor.js`

Remembers where the user's mouse cursor was before desktop control moved it.

## Methods

- `new SavedCursor(api)` reads `GetCursorPos` from the raw Win32 table.
- `saved` whether the position could be read.
- `restore()` puts the cursor back with `SetCursorPos` (no-op when not saved).
