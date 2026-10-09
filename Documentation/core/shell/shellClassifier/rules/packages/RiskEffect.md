# RiskEffect

`core/shell/shellClassifier/rules/packages/RiskEffect.js`

The consequence vocabulary the tool tables speak in, and the sentence each becomes on the approval card.

## Effects

`PUBLISH`, `WITHDRAW`, `REGISTRY_ACCESS`, `TEARDOWN`, `UNREVIEWED_CHANGE`, `STATE_REWRITE`, `DISRUPTION`,
`DATA_LOSS`, `ACCOUNT_REMOVAL`, `SERVER_CONFIG`, `HOST_EXPOSURE`, `BULK_CLEANUP`, `UNCONFIRMED_REMOVAL`, `CACHE_WIPE`;
`CONSEQUENCES` maps each to its sentence.

## Methods

- `RiskEffect.reasonFor({ effect, subject, scope })` -> `"<subject> (<scope>) <consequence>"`, or `null` for no
  finding or an unknown effect.
- `RiskEffect.isKnown(effect)`.

## Why

Naming the consequence (who is affected, what is lost) instead of restating the command tells the user why the card
appeared. One vocabulary keeps reasons consistent across fourteen ecosystems.
