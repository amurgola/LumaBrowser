# RunTimeText

`core/llm-server/ui/js/chat/common/RunTimeText.js`

Short time texts for the artifact history and the task and trigger views.

## Methods

- `RunTimeText.when(iso)`: "Jun 19, 11:53 PM" in the user's locale; `''` when missing.
- `RunTimeText.every(ms)`: "Every day", "Every 3 hours", "Every 90 minutes".
- `RunTimeText.duration(startIso, endIso)`: "42s", "2m 03s", `''` when unfinished.
