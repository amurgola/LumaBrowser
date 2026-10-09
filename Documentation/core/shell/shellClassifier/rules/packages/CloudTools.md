# CloudTools

`core/shell/shellClassifier/rules/packages/CloudTools.js`

[ToolFamily](ToolFamily.md) for cloud provider CLIs and hosting platforms, each with its own delete vocabulary.

## Table

- aws: `s3 rm` (scoped when `--recursive`), `s3 rb --force`, `s3 sync --delete` are data loss; `s3 rb` and any
  `<service> delete-*|terminate-*|deregister-*|purge-*` operation are teardown. S3 and API rows are previewable
  (`--dryrun`, `--dry-run`); `s3 rb` is not.
- az: `group delete` (scoped to the resource group), any `delete|purge`.
- gcloud: `projects delete` (scoped to the project), any `delete`. doctl: `delete|del|rm`.
- fly/flyctl `destroy|delete|remove|rm`; heroku `pg:reset` (data loss) and `<topic>:destroy|delete|remove`;
  vercel `remove|rm`; netlify `<topic>:delete`; railway `down|delete`; wrangler `delete`.

## Why

AWS puts the operation second and names it with a verb prefix, so only that position is checked (a stack named
`delete-me` is not a delete). The other CLIs end their command path with the verb, so the verb is looked for among the
words.
