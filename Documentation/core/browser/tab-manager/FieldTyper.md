# FieldTyper

`core/browser/tab-manager/FieldTyper.js`

type: focus, framework-safe value set and optional submit in one call.

## Methods

- `FieldTyper.typeInto(page, { selector, ref, text, submit = false, clear = true })` ->
  `data: { tagName, value, submitted, method, evidence?, note? }` plus `urlChanged` / `newUrl`.
  A submit that did not change the URL gets `note: 'URL did not change after submit'`.

## Why

It replaces the click, fill_form, press_key chain models used to spell out (and get wrong). Without a before-fingerprint, submits get the 3 s navigation wait and plain typing returns at once.
