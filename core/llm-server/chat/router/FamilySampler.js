const ModelFamilies = require('../../server/ModelFamilies');

class FamilySampler {
  static PENALTY_KEYS = ['repeat_penalty', 'presence_penalty', 'frequency_penalty'];

  static forTurn(plan, extra) {
    const family = (plan && plan.familySamplerDefaults) || null;
    if (!family) return null;
    if (!(extra && extra.pinTemperature)) return family;
    const rest = { ...family };
    delete rest.temperature;
    if (!ModelFamilies.penaltyHostile(plan && plan.modelFamily)) FamilySampler._dropDisabledPenalties(rest);
    return Object.keys(rest).length ? rest : null;
  }

  static _dropDisabledPenalties(sampler) {
    for (const key of FamilySampler.PENALTY_KEYS) {
      if (key in sampler && FamilySampler._isDisabled(key, sampler[key])) delete sampler[key];
    }
  }

  static _isDisabled(key, value) {
    if (typeof value !== 'number') return false;
    return key === 'repeat_penalty' ? value <= 1 : value === 0;
  }
}

module.exports = FamilySampler;
