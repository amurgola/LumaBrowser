# X11ChordPoller

`extensions/desktop-integration/features/hotkeys/X11ChordPoller.js`

Turns one read of the X physical key map into the held modifiers (Windows
virtual-key codes, the feature's vocabulary) and the chords that just
completed. Pure: the key map is a predicate.

## Methods

- `new X11ChordPoller({ keycodeOf })`: `keycodeOf(keysym)` -> keycode or 0.
- `setChords([{ id, modifiers: [vk], keysym }])`: replaces the watched chords;
  returns the ids whose key has no keycode on this layout. `chordCount`.
- `tick(down)`: `{ held: [vk], fired: [id] }`. A chord fires on the edge where
  its key goes down while exactly its modifiers are held (either side of a
  modifier counts), and not again until the key was released.
- `MODIFIERS`: vk -> the keysyms of both physical keys.
