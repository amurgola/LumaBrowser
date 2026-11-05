# MediaGallery

`core/llm-server/ui/js/chat/panel/media/MediaGallery.js`

The conversation's images and videos in reading order for the viewer's
filmstrip and previous / next: every image or video artifact on the messages
on screen (user attachments included, the streaming message too), once per id,
each as `{ artifact, message }`.

## Methods

- `MediaGallery.collect(state)`.
- `MediaGallery.around(state, artifact)`: `{ items, index }`; an artifact not
  on screen (opened from the all-artifacts list) stands alone.
