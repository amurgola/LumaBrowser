# LendWaiters

`core/network-sharing/host/rpc/LendWaiters.js`

The queue of local launches waiting for a GPU lend to end.

## Methods

- `wait(timeoutMs)` resolves true on `wakeAll()`, or false after `timeoutMs`
  (the entry leaves the queue; the timer is unref'd).
- `wakeAll()` resolves every waiter true and empties the queue.
- `size` the number of waiters.

## Why

The LLM server launcher calls `RpcLendingService.waitUntilFree(30000)` so a
local boot waits briefly behind a remote consumer instead of racing it for VRAM.
