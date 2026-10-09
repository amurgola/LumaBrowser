class ToggleConstraints {
  static compute(ledger) {
    const constraints = {};
    for (const [id, manifest] of ledger.manifests) {
      const deletable = !!manifest._userInstalled;
      const enabled = ledger.isActive(id);
      const reason = enabled ? ToggleConstraints._disableBlocker(ledger, id) : ToggleConstraints._enableBlocker(ledger, manifest);
      constraints[id] = { enabled, canToggle: !reason, reason, deletable };
    }
    return constraints;
  }

  static _disableBlocker(ledger, id) {
    const dependent = ledger.activeDependentOf(id);
    return dependent ? `Required by ${dependent.name}` : '';
  }

  static _enableBlocker(ledger, manifest) {
    const missing = ledger.firstInactiveRequirement(manifest);
    return missing ? `Requires ${ledger.nameOf(missing)} to be enabled first` : '';
  }
}

module.exports = ToggleConstraints;
