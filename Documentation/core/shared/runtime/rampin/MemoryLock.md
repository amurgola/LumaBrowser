# MemoryLock

`core/shared/runtime/rampin/MemoryLock.js`

Base class (interface) for the platform memory locks used by RAM pinning. Every method throws until a subclass implements it. Implementations: `WindowsMemoryLock`, `LinuxMemoryLock`.

## Methods

- `prepare(totalBytes)` raises the process limit so `totalBytes` can be locked;
  throws with a user-facing explanation when it cannot.
- `mapFile(file)` maps `{ path, sizeBytes }` read-only and shared, returning the
  base address as a Number.
- `lockAsync(address, length)` resolves once the range is locked into RAM, off
  the main thread.
