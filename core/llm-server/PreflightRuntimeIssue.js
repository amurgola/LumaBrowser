class PreflightRuntimeIssue {
  static findRuntime(view, runtimeId) {
    if (!view || !Array.isArray(view.runtimes)) return null;
    return view.runtimes.find((r) => r && r.id === runtimeId) || null;
  }

  static forRow(row, context) {
    if (!row) return PreflightRuntimeIssue._unknown(context);
    if (!row.installed) return PreflightRuntimeIssue._notInstalled(row, context);
    if (row.hardware && row.hardware.ready === false) return PreflightRuntimeIssue._hardwareNotReady(row, context);
    return null;
  }

  static _unknown({ runtimeId, area, featureLabel, view }) {
    return {
      id: `${area}-runtime-unknown`,
      area,
      severity: 'error',
      title: `${featureLabel} runtime "${runtimeId}" is not available`,
      detail: 'The configured runtime is not offered on this platform. Choose a different runtime in Setup.',
      fix: { kind: 'open-view', view },
    };
  }

  static _notInstalled(row, { runtimeId, area, server, featureLabel, view }) {
    const name = row.name || runtimeId;
    return {
      id: `${area}-runtime-missing`,
      area,
      severity: 'error',
      title: `${name} is not installed`,
      detail: row.staleManualRegistration
        ? `${featureLabel} is set to use ${name}, but its registered binary no longer exists at the saved path.`
        : `${featureLabel} is set to use ${name}, but the binary is not installed, so nothing can start until it is.`,
      fix: PreflightRuntimeIssue._isDownloadable(row)
        ? { kind: 'install-runtime', server, runtimeId: row.id, runtimeName: name }
        : { kind: 'open-view', view },
    };
  }

  static _hardwareNotReady(row, { runtimeId, area, view }) {
    return {
      id: `${area}-runtime-hardware`,
      area,
      severity: 'warning',
      title: `${row.name || runtimeId} may not run on this hardware`,
      detail: row.hardware.note || 'This host does not meet the configured runtime\'s hardware requirements.',
      fix: { kind: 'open-view', view },
    };
  }

  static _isDownloadable(row) {
    return row.assetSupported !== false && row.acquisition !== 'manual-source';
  }
}

module.exports = PreflightRuntimeIssue;
