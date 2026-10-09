# LinuxMemoryLock

`core/shared/runtime/rampin/LinuxMemoryLock.js`

The Linux `MemoryLock`: `mlock` on a read-only `MAP_SHARED` mmap, called
through koffi against `libc.so.6`.

## Methods

- `new LinuxMemoryLock()` loads libc via koffi and binds `open`, `mmap`,
  `mlock`, `getrlimit`, `setrlimit`.
- `prepare(totalBytes)` raises the soft `RLIMIT_MEMLOCK` to the hard limit, then
  throws `limitError` if the hard limit is below `totalBytes`. If `getrlimit`
  fails, the limit is treated as 0 and the pin is refused (legacy behaviour).
- `mapFile(file)` opens read-only and mmaps `file.sizeBytes`; failures throw
  with the errno.
- `lockAsync(address, length)` runs `mlock` on the libuv threadpool.
- `LinuxMemoryLock.toBigLimit(value)` converts a koffi rlimit field to BigInt;
  Numbers at or above 2^62 count as `RLIM_INFINITY`, because koffi may return
  uint64 fields as imprecise Numbers.
- `LinuxMemoryLock.limitError(limitBytes, totalBytes)` returns `null` when the
  limit is unlimited or large enough, otherwise an Error telling the user to add
  `* hard memlock unlimited` to `/etc/security/limits.conf` (or
  `LimitMEMLOCK=infinity` for systemd).

## Why

The default soft memlock limit is kilobytes to a few MB. Raising the soft limit
to the hard limit needs no privileges, and checking up front gives a useful
message instead of a bare mlock failure halfway through a model.
