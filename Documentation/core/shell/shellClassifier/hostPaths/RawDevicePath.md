# RawDevicePath

`core/shell/shellClassifier/hostPaths/RawDevicePath.js`

Recognizes a path that names a raw disk or volume device rather than a file.

## Methods

- `RawDevicePath.is(path)`: true for `/dev/<name>` other than the pseudo-devices (`null`, `zero`, `random`,
  `urandom`, `stdout`, ttys, `pts/`, `fd/`, `shm/`, ...) and for the Win32 device namespace
  (`\\.\PhysicalDrive0`, `\\.\C:`).

## Why

Unknown `/dev` names count as devices: failing closed costs one prompt, failing open costs a disk. Used by the disk
tools (`dd of=`, `shred`) and by mount checks to skip device operands.
