class DriftRecord {
  static next(previous, drift, runId = null, now = new Date()) {
    const at = now.toISOString();
    const isNew = !previous || previous.sig !== drift.sig;
    return {
      isNew,
      drift: {
        sig: drift.sig,
        missing: drift.missing,
        typeChanged: drift.typeChanged,
        added: drift.added,
        contentTypeChanged: drift.contentTypeChanged,
        firstAt: isNew ? at : previous.firstAt,
        at,
        count: isNew ? 1 : (previous.count || 0) + 1,
        runId: runId || (previous && previous.runId) || null,
      },
    };
  }
}

module.exports = DriftRecord;
