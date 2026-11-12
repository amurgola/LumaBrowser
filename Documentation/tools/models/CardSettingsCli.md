# CardSettingsCli

`tools/models/CardSettingsCli.js`

`npm run models:card-settings -- --repo <owner/name> --model <file or name>
[--dry-run] [--db <path>]`

Applies a model card's recommended sampler settings to a model already on disk
(one that did not arrive through the app's downloader). It asks the Hub what
the repo recommends, prints it, and writes it into the model's own settings in
the app's settings database the way the downloader does: only fields the model
has no value for. `--dry-run` writes nothing. Close the app first.
