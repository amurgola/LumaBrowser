class PhaserProbeReport {
  static MAX_TEXTURES = 24;

  static lines(games) {
    const lines = [];
    for (const g of games || []) {
      if (g.error) { lines.push(`Phaser probe failed: ${g.error}`); continue; }
      const scenes = g.scenes || [];
      lines.push(`Phaser (${g.renderer}) active scene${scenes.length === 1 ? '' : 's'}:`);
      lines.push(...scenes.map((sc) => PhaserProbeReport._scene(sc)));
      if (g.missing && g.missing.length) lines.push(`  MISSING textures referenced by objects: ${[...new Set(g.missing)].join(', ')}`);
      if (g.textures && g.textures.length) lines.push(PhaserProbeReport._loaded(g.textures));
    }
    return lines;
  }

  static _scene(sc) {
    const types = Object.entries(sc.byType || {}).map(([t, n]) => `${t}×${n}`).join(', ');
    const objLines = (sc.list || []).map((o) => `    - ${PhaserProbeReport._object(o)}`);
    return `  scene "${sc.key}": ${sc.objects} objects (${sc.visible} visible${types ? `: ${types}` : ''}); ${PhaserProbeReport._camera(sc.camera)}`
      + (sc.textures && sc.textures.length ? `; textures in use: ${sc.textures.join(', ')}` : '')
      + (objLines.length ? `\n${objLines.join('\n')}` : '');
  }

  static _camera(cam) {
    if (!cam) return 'no camera';
    const fade = cam.fade;
    const lingering = fade && (fade.running || (fade.alpha > 0 && fade.complete));
    return `camera scroll (${cam.scrollX},${cam.scrollY}) zoom ${cam.zoom} alpha ${cam.alpha}`
      + (lingering ? ` FADE ${fade.running ? 'running' : 'left at'} alpha ${fade.alpha}` : '');
  }

  static _object(o) {
    const bits = [`${o.type}${o.tex ? `[${o.tex}]` : ''} @(${o.x},${o.y})`, `depth ${o.depth}`];
    if (o.w != null || o.h != null) bits.push(`${o.w}x${o.h}`);
    if (o.alpha !== 1) bits.push(`alpha ${o.alpha}`);
    if (o.visible === false) bits.push('HIDDEN');
    if (o.sf != null && o.sf !== 1) bits.push(`scrollFactor ${o.sf}`);
    if (o.kids != null) bits.push(`${o.kids} children`);
    return bits.join(', ');
  }

  static _loaded(textures) {
    const more = textures.length > PhaserProbeReport.MAX_TEXTURES ? ', …' : '';
    return `  loaded textures: ${textures.slice(0, PhaserProbeReport.MAX_TEXTURES).join(', ')}${more}`;
  }
}

module.exports = PhaserProbeReport;
