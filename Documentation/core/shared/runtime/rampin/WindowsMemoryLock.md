# WindowsMemoryLock

`core/shared/runtime/rampin/WindowsMemoryLock.js`

The Windows `MemoryLock`: `VirtualLock` on a read-only shared file mapping,
called through koffi (prebuilt N-API FFI, no compile step).

## Methods

- `new WindowsMemoryLock()` loads `kernel32.dll` via koffi and binds the calls.
- `prepare(totalBytes)` raises the working-set minimum to
  `totalBytes + WORKING_SET_SLACK_BYTES` (1 GiB) with
  `QUOTA_LIMITS_HARDWS_MIN_ENABLE`, maximum 512 MiB above that. Throws with the
  Win32 error on failure.
- `mapFile(file)` runs `CreateFileW` (share read, write and delete, so
  llama.cpp and the user are never blocked), `CreateFileMappingW`
  (`PAGE_READONLY`) and `MapViewOfFile` (`FILE_MAP_READ`); returns the base.
  Each failure throws "`<Call>` failed for `<path>` (Win32 error N)."
- `lockAsync(address, length)` runs `VirtualLock` on the libuv threadpool.

## Why

- `VirtualLock` is capped by the process working-set minimum, so it must cover
  every file plus slack for the Node heap; the hard minimum stops the OS
  trimming below it, which is the point of pinning.
- Handles and pointers are declared `int64` so they come back as plain Numbers
  for offset arithmetic. The register-level ABI is identical on x64 and the
  `-1` pseudo-handles compare exactly.
- A failed async `VirtualLock` carries no reliable error code, because
  `GetLastError` is per-thread and the call ran on a libuv thread. The cause is
  nearly always the working-set quota, which the message says.
