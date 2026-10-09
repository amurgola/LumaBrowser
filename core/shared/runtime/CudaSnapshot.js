class CudaSnapshot {
  static STABLE_FAILURE_PATTERN = /not found|not available/i;

  static isTransientCudaFailure(cuda) {
    if (!CudaSnapshot._isRecordedFailure(cuda)) return false;
    const reason = String(cuda.reason || '');
    if (!reason) return false;
    return !CudaSnapshot.STABLE_FAILURE_PATTERN.test(reason);
  }

  static _isRecordedFailure(cuda) {
    return Boolean(cuda) && cuda.available === false;
  }
}

module.exports = CudaSnapshot;
