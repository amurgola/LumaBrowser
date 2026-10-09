# CmdletTools

`core/shell/shellClassifier/rules/packages/CmdletTools.js`

[ToolFamily](ToolFamily.md) for PowerShell cmdlets that publish modules or remove cloud resources. Every row is
previewable with `-WhatIf`.

## Table

- Publish: `Publish-Module`, `Publish-Script`, `Publish-PSResource`.
- Teardown: `Remove-AzResourceGroup` (scoped to the resource group), any other `Remove-Az<Noun>`, `Remove-S3Bucket`,
  `Remove-EC2Instance`, `Remove-RDSDBInstance`, `Remove-RDSDBCluster`.
- Data loss: `Remove-S3Bucket -DeleteBucketContent`, `Remove-S3Object`.

## Methods

- `tableKey(tool)` -> the tool itself when listed, `AZ_REMOVAL_KEY` (`remove-az*`) for other `Remove-Az*` cmdlets.

## Why

On Windows the agent often reaches registries and clouds through PowerShell modules rather than CLIs; without this
family those calls would get no reason at all. Host package managers (winget, choco, scoop) belong to SystemRule.
