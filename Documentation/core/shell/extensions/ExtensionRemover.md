# ExtensionRemover

`core/shell/extensions/ExtensionRemover.js`

Fully deletes a user-installed extension.

## Methods

- `new ExtensionRemover({ ledger, disabled, userExtensionsDir, disable(id), fsOps = fs })`.
- `remove(id)` resolves `{ success, id?, error? }`. Refusals:
  `Extension "<id>" not found`; `"<id>" is a built-in extension and cannot be
  deleted - you can disable it instead.`; `Cannot delete "<id>" - required by
  "<name>". Remove it first.`; `Refusing to delete "<id>" - its files are not
  inside the user extensions directory.` Then it disables an active copy,
  forgets the manifest, disabled entry and load-order slot, busts the require
  cache, removes the folder (`Failed to remove files: ...`) and broadcasts
  `core.shell.extensionDeleted`.

## Why

Deletability is decided by location only, never by a manifest flag, so an
add-on cannot make itself unremovable. Containment is strict
(`ContainedPath.isWithin`), so the extensions dir itself can never be deleted.
