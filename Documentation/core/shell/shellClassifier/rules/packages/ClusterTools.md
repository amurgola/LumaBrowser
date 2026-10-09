# ClusterTools

`core/shell/shellClassifier/rules/packages/ClusterTools.js`

[ToolFamily](ToolFamily.md) for `kubectl`, `oc` and `helm`. Every row is previewable (`--dry-run=client|server`).

## Table

- `delete`: teardown; scoped "whole namespaces, volumes or every resource" with `--all`, `-A`, `--all-namespaces`, or
  a sweeping kind (`SWEEPING_KINDS`: namespace, persistent volume, CRD in every spelling) named alone, in a list
  (`ns,pv`) or as `kind/name`.
- Disruption: `drain`, `cordon`, `taint`, `scale` to zero replicas (`=0` or `0`), `rollout undo`, `replace --force`.
- Teardown: `apply --prune`.
- helm: `uninstall|delete|del|un` teardown; `rollback` and `upgrade --force` disruption.

## Why

Deleting a namespace or volume takes everything beneath it, so the card says so. Cordon only stops scheduling, so its
scope says that rather than claiming eviction.
