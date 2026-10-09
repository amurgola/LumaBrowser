# GearToolList

`core/llm-server/ui/js/chat/composer/GearToolList.js`

The gear panel's per-chat agent tool checklist: collapsible groups (collapsed by
default) with a tri-state group box and an on/total count. It inherits the host
catalog minus the global denylist, except `surfaceWhenDisabled` tools, which
show unchecked; the first check of one removes it from the GLOBAL denylist.

## Methods

- `render(container)`: shows the cached catalog at once and always refetches
  (`api.chat.agentTools`), since Tool Forge can publish tools mid-session.
- `setToolDisabled(name, disabled, { defer }?)`, `persist()`: before the
  conversation exists the denylist rides the first turn; after,
  `api.conv.setDisabledTools`.
