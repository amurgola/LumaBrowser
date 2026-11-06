# UtilityManuals

`core/llm-server/chat/tool-groups/UtilityManuals.js`

Data only: the full prose manuals for the lookup and utility tool groups.

## Members

- `UtilityManuals.WEB`: `web_search` search and fetch modes, fetch by result
  number, `find`, and reading long pages by `part`.
- `UtilityManuals.KNOWLEDGE_BASE`: `search_knowledge_base`.
- `UtilityManuals.VALIDATE`: `validate_code` (its `filename` param is
  prose-only: the schema does not list it).
- `UtilityManuals.PROGRAMMATIC`: `send_webhook`, only to endpoints the user gave.

## VAULT

How to use `vault_list` / `vault_fill`: open the form, list for its tab, fill, then submit; never ask the user to type a password into the chat; a refusal on another site means stop.

The VAULT manual also covers two-factor (`part: "otp"`) and `{{vault:name}}` key placeholders.
