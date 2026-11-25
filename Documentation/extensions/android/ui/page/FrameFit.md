# FrameFit

`extensions/android/ui/page/FrameFit.js`

Watches the room the screen has on the page and asks the device to take exactly that size.

## Methods

- `attach()` observes the element; a new size is sent once it has held for 300 ms, since every new size makes Android lay its apps out again.
- `FrameFit.frameOf(box, scale)`: the box in device pixels and a density of 160 times the display scale, which makes Android's controls the size a web page's would be.
