# OutlineTreeBuilder

`core/llm-server/chat/outline/OutlineTreeBuilder.js`

Turns a [ValueProfile](ValueProfile.md) tree into [OutlineNode](OutlineNode.md)s.

## Methods

- `OutlineTreeBuilder.build(rootProfile)`: the root node. Fields come before
  the `[*]` element node; a field seen in fewer objects than its parent held is
  labelled `name?` and its text ends `, in X of Y`.
