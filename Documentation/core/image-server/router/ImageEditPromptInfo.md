# ImageEditPromptInfo

`core/image-server/router/ImageEditPromptInfo.js`

Works out how `edit_image` will run on this machine and the prompt rules that go
with it, for the chat agent's system prompt.

## Methods

- `new ImageEditPromptInfo({ imageServerService, models })`; `models` is an
  [ImageModelResolver](ImageModelResolver.md).
- `resolve(picks?)` resolves
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
  `picks` are the caller's own models ([ImageModelPicks](ImageModelPicks.md), a
  chat conversation's): they stand in for the edit and generation defaults in
  steps 2 to 4, so the rules follow the model that conversation's `edit_image`
  really runs on.

## Why

The rules must match the route `edit_image` takes in the chat bridge, or the
agent is taught `<image2>` tags for an img2img redraw. For a remote editor the
family is unknown here, and the host's router re-words the prompt for whatever
it runs, so plain numbers are safest.
