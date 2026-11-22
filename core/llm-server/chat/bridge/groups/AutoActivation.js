const ToolGroups = require('../../ToolGroups');

class AutoActivation {
  static check(name, params, groups) {
    const owning = groups.owningGroups(name);
    if (!owning.length || owning.some((k) => groups.active.has(k))) return null;
    const primary = owning[0];
    groups.activate([primary]);
    const docs = groups.docsFor([primary]);
    if (!groups.rulesFirst(primary) || ToolGroups.carriesGeneratedPayload(name, params)) return { group: primary, docs };
    return { bounce: { success: true, activated: [primary], autoActivated: true, message: AutoActivation.sentBack(name, primary, docs) } };
  }

  static sentBack(name, group, docs) {
    return `${name} was NOT run: nothing has happened yet. Its tools ("${group}") were not loaded; they are loaded now. `
      + `Read the instructions below, then call ${name} again, following them.\n\n${docs}`;
  }

  static appendManual(result, activation) {
    const note = AutoActivation.manualNote(activation);
    if (!note || !result || typeof result !== 'object') return;
    if (typeof result.message === 'string') result.message += note;
    else result.message = note.trim();
  }

  static manualNote(activation) {
    if (!activation || !activation.docs) return '';
    return `\n\nThe "${activation.group}" tools are now active (auto-loaded by this call). `
      + `Your call ran; these are the rules for using them from here:\n\n${activation.docs}`;
  }
}

module.exports = AutoActivation;
