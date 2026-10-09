# MirrorSync

`core/shell/shellClassifier/rules/filesystem/MirrorSync.js`

[FileOperation](FileOperation.md) for mirroring copies that delete what the source lacks.

- `rsync` with any `--delete*` option; destination is the last non-flag word.
- `robocopy` with `/MIR` or `/PURGE`; destination is the second path.
- Protected kinds: root and home. Mirroring an empty directory onto `/` or `~` wipes it; mirroring config into
  `/etc/nginx` is a legitimate deploy, so system paths only sweep.
