class PlayabilityNotes {
  static MAX_BODIES = 4;
  static MAX_TEXTS = 6;

  static build({ games = [], texts = [], inputs = 0 } = {}) {
    const bodies = PlayabilityNotes._bodyLines(games);
    const strays = PlayabilityNotes._strayLines(games);
    const backdrops = PlayabilityNotes._backdropLines(games);
    const timeline = PlayabilityNotes._timelineLines(texts);
    const stalled = PlayabilityNotes._stalledLine(texts, inputs);
    return {
      lines: [...bodies, ...strays, ...backdrops, ...timeline, ...(stalled ? [stalled] : [])],
      checks: [bodies, strays, backdrops].filter((found) => found.length).length + (stalled ? 1 : 0),
    };
  }

  static _strayLines(games) {
    return PlayabilityNotes._scenes(games)
      .filter((scene) => scene.strayCount > 0)
      .map((scene) => `CHECK off screen: in scene "${scene.key}" ${scene.strayCount} object${scene.strayCount === 1 ? ' is' : 's are'} more than a `
        + `whole screen outside the view (${(scene.strays || []).map((o) => `[${o.tex}] at (${o.x},${o.y})`).join(', ')}). If `
        + 'they are meant to be in play, something carried them off: usually gravity. Adding a sprite to a physics group '
        + 'RESETS its body to the group defaults, so set allowGravity / immovable AFTER group.add(), or pass them in the '
        + 'group config ({ allowGravity: false, immovable: true }). If they are spent, destroy them.');
  }

  static _bodyLines(games) {
    const found = PlayabilityNotes._scenes(games).flatMap((scene) => scene.bodies || []);
    if (!found.length) return [];
    const shown = found.slice(0, PlayabilityNotes.MAX_BODIES).map((b) => `  - [${b.tex}] visible art ${PlayabilityNotes._rect(b.art)}, collision body ${PlayabilityNotes._rect(b.body)}`);
    return [
      'CHECK hitboxes: these collision bodies do not match the pixels the player can see, so the player collides with '
        + 'empty space, or passes through what looks solid. The art box is the OPAQUE part of the image, margins left out:',
      ...shown,
      '  Size the body to the art (body.setSize(w, h) with setOffset so both boxes line up), or crop/scale the image '
        + 'with setDisplaySize so the art fills the body. Remember the default origin is the CENTRE of the image.',
    ];
  }

  static _backdropLines(games) {
    return PlayabilityNotes._scenes(games)
      .filter((scene) => scene.backdrop)
      .map((scene) => `CHECK backdrop: in scene "${scene.key}" the large image [${scene.backdrop.tex}] is drawn at `
        + `${PlayabilityNotes._rect(scene.backdrop.rect)} and the big images together cover only `
        + `${Math.round(scene.backdrop.covered * 100)}% of the screen. An image is positioned by its CENTRE unless you `
        + 'call setOrigin(0, 0): place a full-screen backdrop at (width / 2, height / 2), or at (0, 0) with setOrigin(0, 0).');
  }

  static _timelineLines(texts) {
    const samples = (texts || []).filter((sample) => sample && Array.isArray(sample.texts));
    if (!samples.some((sample) => sample.texts.length)) return [];
    const lines = ['ON-SCREEN TEXT at each captured frame:'];
    let run = null;
    for (const sample of samples) {
      const shown = PlayabilityNotes._shown(sample.texts);
      if (run && run.shown === shown) { run.last = sample.label; continue; }
      if (run) lines.push(PlayabilityNotes._timelineLine(run));
      run = { first: sample.label, last: sample.label, shown };
    }
    if (run) lines.push(PlayabilityNotes._timelineLine(run));
    return lines;
  }

  static _stalledLine(texts, inputs) {
    const samples = (texts || []).filter((sample) => sample && Array.isArray(sample.texts));
    if (samples.length < 2 || !(inputs > 0)) return null;
    const numbers = samples.map((sample) => PlayabilityNotes._numbers(sample.texts));
    if (!numbers.some((seen) => seen.length)) return null;
    if (numbers.some((seen) => seen.join(',') !== numbers[0].join(','))) return null;
    return 'CHECK progress: no number on screen changed during the whole run (score, timer, lives all stood still), so '
      + 'this run does not show the player getting anywhere. Run again with scripted actions that play one success '
      + '(pass one obstacle, collect one item) and confirm the number moves before telling the user the game plays.';
  }

  static _timelineLine(run) {
    const span = run.first === run.last ? run.first : `${run.first} to ${run.last}`;
    return `- ${span}: ${run.shown || '(no text)'}`;
  }

  static _shown(texts) {
    const more = texts.length > PlayabilityNotes.MAX_TEXTS ? ', …' : '';
    return texts.slice(0, PlayabilityNotes.MAX_TEXTS).map((text) => `"${text}"`).join(', ') + more;
  }

  static _numbers(texts) {
    const found = texts.flatMap((text) => String(text).match(/-?\d+(?:\.\d+)?/g) || []);
    return [...new Set(found)].sort();
  }

  static _scenes(games) {
    return (games || []).flatMap((game) => (game && Array.isArray(game.scenes) ? game.scenes : []));
  }

  static _rect(rect) {
    return rect ? `${rect.w}x${rect.h} at (${rect.x},${rect.y})` : '(unknown)';
  }
}

module.exports = PlayabilityNotes;
