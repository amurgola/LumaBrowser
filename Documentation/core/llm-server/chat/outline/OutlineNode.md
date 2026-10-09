# OutlineNode

`core/llm-server/chat/outline/OutlineNode.js`

One line of the outline and the lines beneath it.

## Methods

- `new OutlineNode({ label, path, depth, text, detail })`: `label` is the path
  as shown (with `?` when optional), `path` the bare JSONPath.
- `line(withDetail = false)`: indented two spaces per depth.
- `moreLine(hidden)`: `(+N more under <path>)`, one level deeper.
- `children`, `unlisted` (known but unprofiled keys), `childTotal`.
