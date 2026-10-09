# Slug

`core/shared/text/Slug.js`

Turns a name into a filesystem- and id-safe slug.

## Methods

- `Slug.from(name, { fallback = '', maxLength = 0, separator = '-' })`
  lowercases the input, replaces every run of characters outside `[a-z0-9]`
  with the separator, and strips all leading and trailing separators.
  `maxLength > 0` truncates and re-trims so a cut never ends on a separator.
  Returns `fallback` when the result is empty. Nullish input counts as empty;
  other non-strings are stringified.

## Why one slug

It owns the decision of which characters are legal in an extension directory
name, a workspace id or a stored record id. Four callers had their own copy and
one had drifted: the shell IPC handler stripped a single leading or trailing
dash (`/^-|-$/`) where the rest stripped all, so `"-- My Ext"` became `my-ext`
through CodeWorkspace but `-my-ext` through the IPC handler (bug M21). Both
create extension directories, so the manifest-id check could disagree with the
directory just made.

Slugs become directory names and stored ids, so any change in output renames
things already on disk. The test file is a table of each caller's real inputs
for that reason.

There is no random-suffix option on purpose: callers that need uniqueness
append their own, so id generation stays visible at the call site.
