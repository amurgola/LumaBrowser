# HiddenTabState

`core/browser/tab-view/HiddenTabState.js`

Keeps a tab's audio and renderer OS priority in step with `entry.hidden`.

## Methods

- `HiddenTabState.sync(entry)`: both of the below.
- `HiddenTabState.syncAudio(entry)`: muted while hidden. A hidden persisted tab
  still receives pushes and raises notifications, but must never be heard.
- `HiddenTabState.syncPriority(entry)`: below-normal OS priority while hidden,
  normal otherwise. Windows only, and skipped while the renderer has no pid.

## Why

Persisted tabs opt out of background throttling so they keep servicing pushes,
which also gives their hidden renderers full foreground scheduling: a dozen SPAs
cold-booting off-screen at launch would compete with the UI for every core.
Below-normal priority lets them run on spare cycles. On POSIX an unprivileged
process can lower another's nice value but never raise it back, which would
leave a refocused tab permanently slow, so priority is left alone there. A
crash reload or boot restore spawns a fresh pid, so [TabLoadEvents](TabLoadEvents.md)
re-applies the priority whenever a hidden tab's load settles.
