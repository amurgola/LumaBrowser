# JournalMarkdown

`extensions/roleplay-mode/journal/JournalMarkdown.js`

Turns the turn journal's events into the readable log, one markdown section per
event in the order things happened. `render(event)` returns the section for
`setup`, `turn_prepare`, `tree_change`, `narrator_request`, `reply`,
`side_call`, `state_changes` and `reaction_end`, or `''` for anything else.

Prompts and replies are printed inside four-backtick fences (their own text
holds `##` headings and code fences). Message ids are shortened to their last
seven characters. The narrator request section carries the context table, the
repeated-content list and the history comparison; the full messages are only
in the JSON-lines copy.
