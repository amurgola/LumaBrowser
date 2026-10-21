const Faults = require('../spec/Faults');
const RunFault = require('./RunFault');

class RetryPolicy {
  constructor({ sleep = RetryPolicy.sleep, now = () => Date.now() } = {}) {
    this._sleep = sleep;
    this._now = now;
  }

  async execute(policy, { signal = null, attempt, onRetry = () => {} }) {
    const attempts = Math.max(1, Number(policy.attempts) || 1);
    const deadline = this._now() + (Number(policy.totalTimeoutMs) || 0);
    for (let n = 1; n <= attempts; n += 1) {
      RetryPolicy.throwIfAborted(signal);
      try {
        return await RetryPolicy.bounded(attempt(n, deadline), {
          timeoutMs: deadline - this._now(), signal, timeoutMessage: `The run exceeded ${policy.totalTimeoutMs}ms`,
        });
      } catch (err) {
        const fault = RunFault.faultOf(err);
        const backoff = Number(policy.backoffMs) || 0;
        if (!fault.retryable || n === attempts || this._now() + backoff >= deadline) throw new RunFault(fault);
        onRetry(n, fault);
        await RetryPolicy.bounded(this._sleep(backoff), { timeoutMs: deadline - this._now(), signal });
      }
    }
    throw RunFault.make(Faults.STEP_FAILED, 'No attempt ran');
  }

  static bounded(promise, { timeoutMs, signal = null, timeoutMessage = null, step = null } = {}) {
    return new Promise((resolve, reject) => {
      let timer = null;
      const onAbort = () => finish(() => reject(RetryPolicy.abortedFault()));
      const finish = (settle) => {
        if (timer) clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        settle();
      };
      if (signal && signal.aborted) return finish(() => reject(RetryPolicy.abortedFault()));
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      if (Number.isFinite(timeoutMs)) {
        const ms = Math.max(0, timeoutMs);
        timer = setTimeout(() => finish(() => reject(RunFault.make(Faults.TIMEOUT, timeoutMessage || `Timed out after ${ms}ms`, { step }))), ms);
      }
      return Promise.resolve(promise).then(
        (value) => finish(() => resolve(value)),
        (err) => finish(() => reject(err)),
      );
    });
  }

  static throwIfAborted(signal) {
    if (signal && signal.aborted) throw RetryPolicy.abortedFault();
  }

  static abortedFault() {
    return RunFault.make(Faults.ABORTED, 'The run was aborted');
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = RetryPolicy;
