# InputRelay

`extensions/android/ui/page/InputRelay.js`

Turns pointer, wheel and keyboard events on the screen canvas into the input messages the device takes.

## Methods

- `InputRelay.pointIn(box, picture, event)`: a mouse position as a pixel of the picture, with the bars of a letterboxed picture taken off.
- `InputRelay.keyMessage(event, action)`: a printable character goes as text, so the host keyboard layout decides what is typed; every other key goes as a key press with its modifiers.
