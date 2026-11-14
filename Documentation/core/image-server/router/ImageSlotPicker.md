# ImageSlotPicker

`core/image-server/router/ImageSlotPicker.js`

Decides which image slot (generation or edit supervisor) serves a request.

## Methods

- `ImageSlotPicker.explicitRole(slot)`: `'edit'` -> `'image-edit'`,
  `'generate'` -> `'image-generate'`, anything else `null`.
- `ImageSlotPicker.remoteRole(slot)`: `'image-edit'` for `'edit'`, else
  `'image-generate'`. A remote host owns its own model and kind routing.
- `ImageSlotPicker.requestRole({ explicitRole, model, wantId, defaults })`: the
  explicit role, else `'image-edit'` for an edit-kind model or a model that is
  the edit default and not also the generation default, else `'image-generate'`.
- `ImageSlotPicker.residentSlot(svc, role, wantId)`: the role's own slot, unless
  only the other image slot has `wantId` ready or starting; then that one.
  Non-image roles (video) are returned untouched. A throwing status reads as not resident.
- `ImageSlotPicker.GENERATE`, `ImageSlotPicker.EDIT`: the role names.

## Why

Kind routing: extensions (roleplay's scene compositor) name their edit model
without a slot; without it the request would land on the generation slot and
load a second copy of a model already resident on the edit slot. Resident
reuse: a unified generate+edit model (Qwen-Image 2.1) pinned as both defaults is
served from whichever slot already holds it, never loaded twice.

Both defaults, no slot: such a request is a plain "make a picture" and takes the
generation role. It used to take the edit role, because the model matched the
edit default, so with one model as both defaults every chat picture ran on the
edit slot: the Image Generate chip on the placement canvas decided nothing, and
a layout that boxed chat, Image Generate and Video on one card did not swap the
chat model out. Edit callers pass `slot: 'edit'`, and `residentSlot` still
reuses a copy that is already loaded on the other slot.
