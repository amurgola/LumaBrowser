# ImageCaptioner

`extensions/lora-trainer/ImageCaptioner.js`

Writes one training caption per picture.

## Methods

- `new ImageCaptioner({ chat, localModelRef })`: `localModelRef()` gives the ref of the
  model this computer serves itself (`local::<name>`), or null.
- `captionModelRef()`: that ref, or null for anything that is not a `local::` ref.
- `caption({ bytes, ext, style, trigger, subject })` -> `{ caption, described }`. With a
  vision-capable local chat model the picture is described through `context.chat.complete`
  (tags or one to two sentences, per the recipe) and prefixed with the trigger.
  Otherwise the caption is the trigger plus the subject line and `described` is false.
- `visionAvailable()`; static `messages`, `clean`, `withTrigger`, `fallback`.

## Privacy

A side completion without a model ref goes to the chat's last-used model, which can be a
cloud provider or a paired sharing peer. Captions therefore always name the local model
(`modelRef: local::...`), and with no local model the pictures are not shown to any model
at all: the fallback caption is used. Found in a privacy review on 2026-11-17.

## Why

The prompt asks for what changes between pictures (pose, clothing, setting) and forbids
the subject's permanent look, so the trigger word is what learns the identity. A model
without vision is never asked: it would not receive the picture and would invent one.
