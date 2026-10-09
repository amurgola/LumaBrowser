# ConversationGroups

`core/llm-server/ui/js/chat/sidebar/ConversationGroups.js`

The sidebar's date buckets: Pinned, then Today, Yesterday, Previous 7 days and
Older by the conversation's last update.

## Methods

- `ConversationGroups.label(iso, now?)`, `ConversationGroups.groupOf(conv, now?)`.
- `ConversationGroups.group(list, now?)`: a Map of label to conversations in
  first-seen order.
