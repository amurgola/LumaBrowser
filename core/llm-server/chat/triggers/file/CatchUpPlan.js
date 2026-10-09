class CatchUpPlan {
  static MAX_FIRES = 50;

  static build(previous, current, events) {
    const wanted = CatchUpPlan._differences(previous, current).filter((c) => events.includes(c.kind));
    wanted.sort((a, b) => CatchUpPlan._mtime(a) - CatchUpPlan._mtime(b));
    const fire = wanted.slice(0, CatchUpPlan.MAX_FIRES);
    return { fire, dropped: wanted.length - fire.length };
  }

  static sameSignature(a, b) {
    return !!a && !!b && a[0] === b[0] && a[1] === b[1];
  }

  static _differences(previous, current) {
    const out = [];
    for (const [rel, sig] of current) {
      const before = previous.get(rel);
      if (!before) out.push({ rel, kind: 'add', sig });
      else if (!CatchUpPlan.sameSignature(before, sig)) out.push({ rel, kind: 'change', sig });
    }
    for (const rel of previous.keys()) if (!current.has(rel)) out.push({ rel, kind: 'remove', sig: null });
    return out;
  }

  static _mtime(candidate) {
    return candidate.sig ? candidate.sig[0] : 0;
  }
}

module.exports = CatchUpPlan;
