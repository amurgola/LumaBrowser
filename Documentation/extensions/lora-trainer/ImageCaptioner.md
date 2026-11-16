# ImageCaptioner

`extensions/lora-trainer/ImageCaptioner.js`

Writes one training caption per picture.

## Methods

- `caption({ bytes, ext, style, trigger, subject })` -> `{ caption, described }`. With a
  vision-capable chat model the picture is described through `context.chat.complete`
  (tags or one to two sentences, per the recipe) and prefixed with the trigger.
  Otherwise the caption is the trigger plus the subject line and `described` is false.
- `visionAvailable()`; static `messages`, `clean`, `withTrigger`, `fallback`.

## Why

The prompt asks for what changes between pictures (pose, clothing, setting) and forbids
the subject's permanent look, so the trigger word is what learns the identity. A model
without vision is never asked: it would not receive the picture and would invent one.
