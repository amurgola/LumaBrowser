# ActionProvider

`core/palette/providers/ActionProvider.js`

Search palette provider for browser commands ([ActionCatalog](../catalog/ActionCatalog.md)):
the name (weight 1), then the synonyms (0.8). The shortcut rides along as the
row's `hint`, so a command found here also teaches its key.

## Methods

- `new ActionProvider({ actions = ActionCatalog })`.
- `byId(id)`, `search(query, { limit = 4 })`: `action` rows, subtitle `Command`.
