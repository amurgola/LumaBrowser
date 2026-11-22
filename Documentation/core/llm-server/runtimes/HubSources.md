# HubSources

`core/llm-server/runtimes/HubSources.js`

How a framework's own model format is found on the Hugging Face Hub.

## Methods

- `HubSources.of(rows)`: `[{ format, tag, extension }]`, one per format, from the installed rows of the runtimes
  view that declare `hub: { tag, extension }`. The format is the row's first format
  ([RuntimeFrameworks](RuntimeFrameworks.md)`.formatsOf`); the extension is lower-cased.
- `HubSources.find(rows, format)`: the source of one format, or null.
- `TAG`, `EXTENSION`: a tag is a plain name (letters, digits, `.`, `_`, `-`), an extension a dot and letters or
  digits. A declaration that does not match is not a source.

## Why

The model search knew two formats, GGUF and MLX. A framework with a format of its own (Basalt packs) could only
offer a fixed list of add-on models. Repos on the Hub carry a tag for the format (`basalt`), so a tag and a file
extension are all the search needs, and a framework can declare them on its rows. Only installed builds count:
a format appears in the search once something on this PC can run it.

Both values end up in a Hub URL and a file filter, which is why they are held to plain names and why
[HfRepoBrowser](../ipc/HfRepoBrowser.md) takes them from here, never from the renderer.
