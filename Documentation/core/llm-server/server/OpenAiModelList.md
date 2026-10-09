# OpenAiModelList

`core/llm-server/server/OpenAiModelList.js`

Builds the `/v1/models` replies of the localhost API.

## Methods

- `OpenAiModelList.build(rows, upstream)` takes installed rows `[{ id }]` and
  the ready upstream (`{ modelId }` or `null`). The loaded model is prepended
  when the rows lack it; rows without an id are dropped. Returns
  `{ object: 'list', data, has_more: false, first_id, last_id }`, each entry
  `{ id, object: 'model', type: 'model', created: 0, created_at:
  '1970-01-01T00:00:00Z', display_name, owned_by: 'lumabrowser', luma_loaded }`.
- `OpenAiModelList.single(id, upstream)` is the `/v1/models/:id` reply.

## Why

One list serves two readers: OpenAI clients read `object`, `created` and
`owned_by`; Claude Code's gateway model discovery reads `type`, `display_name`,
`created_at` and the paging fields. Both read `data[].id`. `luma_loaded` tells
either which id is actually being served.
