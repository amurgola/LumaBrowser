# AssetLedger

`extensions/roleplay-mode/pipeline/AssetLedger.js`

The persisted per-asset retry ledger (`data.assetRetry`).

## Methods

- `canRetry(data, key)` under 3 failures; `noteFail(data, key)`;
  `noteOk(data, key)` clears it, true when there was a record.
