const LabTextScenario = require('./LabTextScenario');
const LabBodyScenario = require('./LabBodyScenario');
const LabRevealScenario = require('./LabRevealScenario');
const LabWoundScenario = require('./LabWoundScenario');
const LabJungleScenario = require('./LabJungleScenario');
const LabControlScenario = require('./LabControlScenario');

class LabTextScenarios {
  static DEFAULT = 'harbour';
  static TABLE = {
    harbour: LabTextScenario, body: LabBodyScenario, reveal: LabRevealScenario, wound: LabWoundScenario, jungle: LabJungleScenario, control: LabControlScenario,
  };

  static names() {
    return Object.keys(LabTextScenarios.TABLE);
  }

  static resolve(which) {
    if (which && typeof which === 'object') return which;
    const name = String(which || LabTextScenarios.DEFAULT).toLowerCase();
    const Cls = LabTextScenarios.TABLE[name];
    if (!Cls) throw new Error('unknown text scenario "' + which + '" (have: ' + LabTextScenarios.names().join(', ') + ')');
    return Object.assign({ name, judges: [] }, Cls.build(), { canned: Cls.canned() });
  }
}

module.exports = LabTextScenarios;
