# InfrastructureTools

`core/shell/shellClassifier/rules/packages/InfrastructureTools.js`

[ToolFamily](ToolFamily.md) for infrastructure-as-code tools.

## Table

- terraform, tofu, terragrunt: `destroy` and `apply -destroy` teardown; `apply -auto-approve` unreviewed change;
  `state <subcommand>` other than `TERRAFORM_STATE_READERS` (list, show, pull, identities), `taint`, `untaint`,
  `import`, `force-unlock`, `workspace delete` state rewrite. terragrunt also: `destroy` anywhere (`run-all destroy`,
  `run --all destroy`), scoped to every module.
- pulumi: `destroy` (previewable via `--preview-only`), `stack rm` teardown; `up|update --yes|-y|--skip-preview`
  unreviewed change; every `state` subcommand state rewrite.
- cdk, cdktf, sst: `destroy|remove` teardown; `deploy --require-approval never` or `--auto-approve` unreviewed change.
- serverless/sls `remove`, vagrant `destroy`: teardown.

## Why

Terraform's state commands are classified by listing the readers, so any new writer is caught by default. Pulumi
has no read-only `state` subcommand (reads go through `pulumi stack export`). Planning and previewing never ask.
