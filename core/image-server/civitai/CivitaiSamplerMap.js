class CivitaiSamplerMap {
  static SAMPLERS = Object.freeze([
    'euler', 'euler_a', 'heun', 'dpm2', 'dpm++2s_a', 'dpm++2m', 'dpm++2mv2', 'ipndm', 'ipndm_v', 'lcm', 'ddim_trailing', 'tcd',
  ]);

  static SCHEDULERS = Object.freeze(['discrete', 'karras', 'exponential', 'ays', 'gits', 'smoothstep', 'sgm_uniform', 'simple']);

  static SCHEDULER_WORDS = Object.freeze([
    ['sgm uniform', 'sgm_uniform', true],
    ['align your steps', 'ays', true],
    ['kl optimal', null, false],
    ['exponential', 'exponential', true],
    ['karras', 'karras', true],
    ['simple', 'simple', true],
    ['smoothstep', 'smoothstep', true],
    ['gits', 'gits', true],
    ['ays', 'ays', true],
    ['beta', 'sgm_uniform', false],
    ['discrete', null, true],
    ['automatic', null, true],
    ['normal', null, true],
    ['uniform', null, false],
  ]);

  static SAMPLER_RULES = Object.freeze([
    [/^euler a(ncestral)?$/, 'euler_a', true],
    [/^euler( dy| smea dy| max| negative)?$/, 'euler', /^euler$/],
    [/^heun(pp2?)?$/, 'heun', /^heun$/],
    [/^dpm\+\+ ?2s a(ncestral)?$/, 'dpm++2s_a', true],
    [/^dpm\+\+ ?2m v2$/, 'dpm++2mv2', true],
    [/^dpm\+\+ ?2m$/, 'dpm++2m', true],
    [/^dpm\+\+ ?(2m |3m )?sde( heun)?$/, 'dpm++2m', false],
    [/^dpm\+\+ ?3m$/, 'dpm++2m', false],
    [/^dpm ?2 a(ncestral)?$/, 'dpm2', false],
    [/^dpm ?2$/, 'dpm2', true],
    [/^dpm (fast|adaptive)$/, 'dpm++2m', false],
    [/^ipndm v$/, 'ipndm_v', true],
    [/^ipndm$/, 'ipndm', true],
    [/^lcm$/, 'lcm', true],
    [/^tcd$/, 'tcd', true],
    [/^ddim( trailing)?$/, 'ddim_trailing', /trailing/],
    [/^(plms|lms|restart|er sde|gradient estimation|seeds \d|sa solver)$/, 'euler', false],
    [/^(deis|res multistep|uni ?pc( bh2)?)$/, 'dpm++2m', false],
  ]);

  static resolve(samplerName, schedulerName) {
    const source = { sampler: samplerName == null ? null : String(samplerName), scheduler: schedulerName == null ? null : String(schedulerName) };
    const embedded = CivitaiSamplerMap._splitScheduler(CivitaiSamplerMap.normalize(samplerName));
    const explicit = schedulerName == null || String(schedulerName).trim() === ''
      ? null
      : CivitaiSamplerMap._splitScheduler(CivitaiSamplerMap.normalize(schedulerName));
    const scheduler = explicit ? explicit.scheduler : embedded.scheduler;
    const schedulerExact = explicit ? explicit.exact : embedded.exact;
    const sampler = CivitaiSamplerMap._sampler(embedded.rest);
    if (!sampler && !embedded.found && !(explicit && explicit.found)) return null;
    return {
      sampler: sampler ? sampler.sampler : null,
      scheduler: scheduler || null,
      exact: (sampler ? sampler.exact : !embedded.rest) && schedulerExact,
      source,
    };
  }

  static sampler(label) {
    const { rest } = CivitaiSamplerMap._splitScheduler(CivitaiSamplerMap.normalize(label));
    return CivitaiSamplerMap._sampler(rest);
  }

  static scheduler(label) {
    return CivitaiSamplerMap._splitScheduler(CivitaiSamplerMap.normalize(label)).scheduler;
  }

  static isSampler(name) {
    return CivitaiSamplerMap.SAMPLERS.includes(name);
  }

  static isScheduler(name) {
    return CivitaiSamplerMap.SCHEDULERS.includes(name);
  }

  static normalize(label) {
    return String(label == null ? '' : label)
      .toLowerCase()
      .replace(/[_\-]+/g, ' ')
      .replace(/\bdpmpp\b/g, 'dpm++')
      .replace(/\bcfg\+\+/g, '')
      .replace(/\b(gpu|cpu|sampler|scheduler|schedule|type)\b/g, '')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  static _splitScheduler(text) {
    let rest = text;
    let scheduler = null;
    let exact = true;
    let found = false;
    for (const [word, value, isExact] of CivitaiSamplerMap.SCHEDULER_WORDS) {
      const re = new RegExp(`(?:^|\\s)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
      if (!re.test(rest)) continue;
      rest = rest.replace(re, ' ').replace(/\s+/g, ' ').trim();
      if (!found) {
        scheduler = value;
        exact = isExact;
        found = true;
      }
    }
    return { rest, scheduler, exact, found };
  }

  static _sampler(rest) {
    if (!rest) return null;
    if (CivitaiSamplerMap.isSampler(rest.replace(/ /g, '_'))) return { sampler: rest.replace(/ /g, '_'), exact: true };
    for (const [re, sampler, exact] of CivitaiSamplerMap.SAMPLER_RULES) {
      if (!re.test(rest)) continue;
      return { sampler, exact: exact instanceof RegExp ? exact.test(rest) : !!exact };
    }
    return null;
  }
}

module.exports = CivitaiSamplerMap;
