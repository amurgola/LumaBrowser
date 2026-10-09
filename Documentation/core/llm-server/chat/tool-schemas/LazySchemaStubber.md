# LazySchemaStubber

`core/llm-server/chat/tool-schemas/LazySchemaStubber.js`

Mirrors lazy tool groups on the native-tool path.

## Methods (all static)

- `apply(fullSchemas, groups, activeGroups)`: each schema whose tool belongs to
  an inactive group is replaced by its stub; with no groups, or no inactive
  tools, the input array is returned as is. `activeGroups` may be a Set or an
  array. A tool in several inactive groups takes the stub of the last one.
- `stubSchema(name, group)`: a parameterless schema whose description is the
  group stub on one line followed by `NOT LOADED YET: call this with no
  arguments to load its instructions, then re-issue your real call with the
  arguments it describes.`

## Why

A stub keeps the tool nameable, so the model can reach for it and hit the
auto-activate bounce, without paying for parameter docs it cannot use yet.
Which tools exist never changes, only their cost.
