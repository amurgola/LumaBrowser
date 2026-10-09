# StreamImages

`core/llm-server/ui/js/chat/stream/StreamImages.js`

Keeps a streaming answer's markdown images (`img.cm-md-img`) steady. Every
flush rebuilds the live body with `innerHTML`, which would recreate each image:
it blinks out, decodes again and the text below jumps. After each repaint the
freshly parsed `<img>` is swapped for the element already on screen with the
same `src`.

A new image that has not loaded is hidden (`cm-img-pending`) and fades in once
(`cm-img-in`, 300 ms) when it loads. Re-inserting an element restarts its CSS
animation, so a fade still running when the image moves into the next repaint
resumes with a negative `animation-delay`. A failed image is shown (as the
browser's broken image) rather than kept invisible.

## Methods

- `new StreamImages(now?)`: injectable millisecond clock.
- `apply(el)`: after a repaint, or on the static body at the end.
- `reset()`.

## Globals

None.
