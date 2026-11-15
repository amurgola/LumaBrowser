# TabViewFit

`extensions/tab-share/TabViewFit.js`

Which guest a shared tab is sized for. Sizing the tab changes it for everyone
watching (five people on one shared window), so it only happens when a guest
asks for it: the viewer page's "Fit to my window" button. That guest then holds
the tab at its window's size, so the site lays out for its screen instead of
arriving as a scaled picture of the host's window.

One guest holds the tab at a time: the last to ask. The holder keeps it until
it gives it back, leaves, or another guest asks. With no holder the tab fills
the host's own content area.

[TabStreamer](TabStreamer.md) owns one per shared tab, decides who may ask at
all (interact mode only, within the input rate limit) and tells guests when
they gain or lose the tab.

## Methods

- `new TabViewFit({ setViewSize })`: `setViewSize({ width, height } | null)`
  sizes the tab's view or gives it back to the host's layout
  ([TabShareService](TabShareService.md) passes
  `TabViewManager.setTabViewSize`). A throw is swallowed (the tab is going away).
- `holder()`: the viewer the tab is sized for, or null.
- `claim(viewer, size)`: the viewer takes the tab at that size; also how the
  holder follows its own window.
- `release(viewer)`: gives the tab back, only when that viewer holds it.
- `clear()`: nobody holds the tab any more (the share left interact mode, or
  the streamer is being destroyed).

`claim`, `release` and `clear` return whether the tab's size changed; an
unchanged size is not applied again (a takeover at the same size changes the
holder only).
