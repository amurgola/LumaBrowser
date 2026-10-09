# RpcChildTerminator

`core/network-sharing/host/rpc/RpcChildTerminator.js`

Ends a lent rpc-server and makes sure it is really gone.

## Methods

- `RpcChildTerminator.terminate(child, { platform?, spawn?, log? })` fire and
  forget. Does nothing for a missing, exited or already-killed child. Otherwise
  `child.kill()`; after `ESCALATE_MS` (3 s), if still alive, `kill('SIGKILL')`
  and on Windows `taskkill /PID <pid> /T /F`; after `VERIFY_MS` (3 s) more, a
  survivor is logged loudly (`[sharing] rpc-server pid <pid> SURVIVED teardown. ...`).
  Timers are unref'd.

## Why

A TerminateProcess that silently fails (a process wedged in a CUDA driver wait)
leaves a zombie rpc-server holding every lent buffer, and the next lend then
OOMs on cards that look free in the manifest. The log is loud because the only
remaining fix is human. Unlike [ChildReaper](../../../shared/runtime/server/ChildReaper.md)
this does not wait: the lease is already over when it runs.
