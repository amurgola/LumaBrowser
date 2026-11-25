# MergedSourceTable

`core/llm-server/chat/tool-groups/MergedSourceTable.js`

Data only: aggregator sources whose tools form one workflow and therefore one
lazy group instead of one group per tool.

## Members

- `MergedSourceTable.SOURCES` (frozen): `core.desktop` -> `desktop`
  ("Desktop control", a stub that names `desktop_launch` for opening apps, the
  observe or screenshot then act loop, description clicks and scrolls for what
  has no ref, hwnd 0 as the whole desktop, and "work like a person": a site's home
  page and its own search and menus, never a guessed URL; once in a desktop app,
  stay on `desktop_*` for it), `core.games` -> `games` ("Game play"),
  `core.delegation` -> `delegation` ("Delegation", a stub that names extension
  building outright so a model asked for an extension finds the builder),
  `ext.tool-forge` -> `tool_forge` ("Tool forge"), each with its stub.
- `MergedSourceTable.forSource(source)`: the spec, or `null`. Own keys only, so
  a prototype name such as `constructor` is never a source.

## Why

As separate groups every step of one job cost an auto-activation bounce:
building one forge tool took three "auto-activated, re-issue your call" round
trips. Activating any tool of a merged group loads all of its manuals.

## Android devices

Source `ext.android` merges the thirteen `android_*` tools into one group, key `android`: start, look, tap or
type and look again are one loop over one device.

## LoRA training

Source `ext.lora-trainer` merges `train_lora`, `lora_training_status`,
`cancel_lora_training` and `apply_lora` into one group, key `lora_training`: start, status
and apply are one job that outlives the turn that started it.
