# ImageEditPromptInfo

`core/image-server/router/ImageEditPromptInfo.js`

Works out how `edit_image` will run on this machine and the prompt rules that go
with it, for the chat agent's system prompt.

## Methods

- `new ImageEditPromptInfo({ imageServerService, models })`; `models` is an
  [ImageModelResolver](ImageModelResolver.md).
- `resolve()` resolves
  `{ mode: 'reference'|'img2img', modelId, label, family, refTag, maxReferences, guide }`
  or `null`, never rejecting. The route, in order:
  1. a remote edit server: reference rules with `modelId: null`, plain word tags;
  2. the edit default, when installed: reference rules for its family;
  3. no edit default and a generation default with `supportsEdit`: reference rules for it;
  4. otherwise the installed generation default: img2img rules (`maxReferences: 0`);
  5. nothing configured or installed: `null`.
  Reference `refTag` and `maxReferences` come from
  [EditProfiles](../prompt/EditProfiles.md) (generic `'word'` and
  `DEFAULT_MAX_REFERENCES` for an unknown family); `guide` is
  [EditGuide](../prompt/EditGuide.md)`.build`.

## Why

The rules must match the route `edit_image` takes in the chat bridge, or the
agent is taught `<image2>` tags for an img2img redraw. For a remote editor the
family is unknown here, and the host's router re-words the prompt for whatever
it runs, so plain numbers are safest.
