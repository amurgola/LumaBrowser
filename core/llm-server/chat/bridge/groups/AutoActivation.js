const ToolGroups = require('../../ToolGroups');

class AutoActivation {
  static check(name, params, groups) {
    const owning = groups.owningGroups(name);
    if (!owning.length || owning.some((k) => groups.active.has(k))) return null;
    const primary = owning[0];
    groups.activate([primary]);
    if (ToolGroups.carriesGeneratedPayload(name, params)) return { group: primary, docs: groups.docsFor([primary]) };
    return {
      bounce: {
        success: true,
        activated: [primary],
        autoActivated: true,
        message: `The "${primary}" tools are now active (auto-loaded because you called ${name} before activating it). Read the instructions below, then RE-ISSUE your ${name} call following them.\n\n${groups.docsFor([primary])}`,
      },
    };
  }

  static appendManual(result, activation) {
    if (!activation || !activation.docs || !result || typeof result !== 'object') return;
    const note = `\n\nThe "${activation.group}" tools are now active (auto-loaded by this call). `
      + `Your call ran; these are the rules for using them from here:\n\n${activation.docs}`;
    if (typeof result.message === 'string') result.message += note;
    else result.message = note.trim();
  }
}

module.exports = AutoActivation;
