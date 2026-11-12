const RestoredStory = require('./RestoredStory');

class StateProbes {
  static ABSENT = Object.freeze([
    { name: 'Marcus Bell', where: /office/i },
    { name: 'Priya Nair', where: /cafe/i },
    { name: 'Mrs. Okafor', where: /2B|flat|stairwell/i },
  ]);

  static list() {
    const S = RestoredStory.SCENES;
    const home = { scene: S.home, present: ['Elena'], absentKnown: true, noPressure: true, turn: 12, historyTurns: 12 };
    return [
      {
        id: 'continue', title: 'Carry on the scene at home',
        action: { type: 'send', text: 'What do you feel like watching tonight?' },
        expect: Object.assign({}, home, { openThread: RestoredStory.MOVIE_THREAD, reply: { mentions: [/film|movie|watch|comedy|thriller|moonlight|northbound/i], sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'recall-debt', title: 'Recall a debt from seven turns back',
        action: { type: 'send', text: 'I open my notebook to the note I made at lunch. How much does Marcus owe me, and when did he say he would pay?' },
        expect: Object.assign({}, home, { reply: { mentions: [/twenty|\b20\b/i, /friday/i], sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'recall-favour', title: 'Recall a favour and an object from the stairs',
        action: { type: 'send', text: 'I take the key on the red ribbon out of my pocket and set it on the shelf. What did I promise to do with it?' },
        expect: Object.assign({}, home, { reply: { mentions: [/plant|fern|water/i, /saturday|sunday|weekend|leeds/i], sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'nobody-else', title: 'Nobody who is elsewhere turns up',
        action: { type: 'send', text: 'I look around the flat. Is anyone else here tonight?' },
        expect: Object.assign({}, home, { reply: { sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'stall', title: 'A quiet turn does not bring the lunch break back',
        action: { type: 'send', text: 'I sit quietly for a while and say nothing.' },
        expect: Object.assign({}, home, { reply: { avoids: [/lunch break|back (?:at|to) the office by one|late back|starving|stomach (?:growl|rumbl)/i], sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'phone', title: 'Phoning someone does not put them in the room',
        action: { type: 'send', text: 'I phone Marcus to ask how the Hendry claim is going.' },
        expect: Object.assign({}, home, { reply: { sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
      {
        id: 'seek', title: 'Going to someone finds them where they were left',
        action: { type: 'send', text: 'I go downstairs and knock on the door of flat 2B.' },
        expect: Object.assign({}, home, { reply: { mentions: [/okafor/i], sceneNotAfter: S.home, presentAfterIncludes: ['Mrs. Okafor'], presentAfterExcludes: ['Elena', 'Priya Nair', 'Marcus Bell'] } }),
      },
      {
        id: 'regenerate', title: 'Regenerating the last reply rewinds to the turn before',
        action: { type: 'regenerate', turn: 12 },
        expect: { scene: S.home, present: ['Elena'], absentKnown: true, noPressure: true, turn: 11, historyTurns: 11, notInRequest: ['Paper Moonlight', RestoredStory.MOVIE_THREAD], reply: { sceneAfter: S.home, presentAfter: ['Elena'] } },
      },
      {
        id: 'edit-middle', title: 'Editing turn six rewinds to the cafe',
        action: { type: 'edit', turn: 6, text: 'I tell him to forget the money and stay for a coffee.' },
        expect: {
          scene: S.cafe, present: ['Priya Nair', 'Marcus Bell'], turn: 5, historyTurns: 5, pressure: RestoredStory.LUNCH_PRESSURE,
          notInRequest: ['Mrs. Okafor', 'red ribbon', 'Paper Moonlight', 'the 14', S.home, S.stairs, 'headache'],
          reply: { sceneAfter: S.cafe, avoids: [/okafor|sofa|headache|paper moonlight/i], presentAfterExcludes: ['Elena', 'Mrs. Okafor'] },
        },
      },
      {
        id: 'delete', title: 'Deleting the last two turns takes the home scene with them',
        action: { type: 'delete', count: 2, text: 'I stop on the landing outside our door and check my pockets.' },
        expect: {
          scene: S.stairs, present: [], turn: 10, historyTurns: 10, noPressure: true,
          notInRequest: ['Paper Moonlight', 'grey blanket', S.home, RestoredStory.MOVIE_THREAD],
          reply: { avoids: [/paper moonlight|northbound/i], presentAfterExcludes: ['Priya Nair', 'Marcus Bell'] },
        },
      },
      {
        id: 'small-window', title: 'With the history trimmed, memory still holds the day', window: 3072,
        action: { type: 'send', text: 'I open my notebook to the note I made at lunch. How much does Marcus owe me, and when did he say he would pay?' },
        expect: Object.assign({}, home, { historyTurns: null, trimmed: true, inRequest: ['twenty dollars', 'Friday'], reply: { mentions: [/twenty|\b20\b/i, /friday/i], sceneAfter: S.home, presentAfter: ['Elena'] } }),
      },
    ];
  }

  static context(probe, { request, before }) {
    const e = probe.expect;
    const out = [];
    const add = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail });
    const text = (m) => (typeof (m && m.content) === 'string' ? m.content : '');
    const messages = Array.isArray(request) ? request : [];
    if (!messages.length) { add('a narrator request was sent', false, 'none was dispatched'); return out; }
    const system = messages[0].role === 'system' ? text(messages[0]) : '';
    const rest = system ? messages.slice(1) : messages;
    const last = text(rest[rest.length - 1]);
    const history = rest.slice(0, -1);
    const all = messages.map(text).join('\n');
    const section = (title) => {
      const at = last.indexOf('## ' + title);
      if (at < 0) return '';
      const end = last.indexOf('\n## ', at + 4);
      const notes = last.indexOf('[Scene notes', at);
      const stop = [end, notes].filter((n) => n > at).sort((a, b) => a - b)[0];
      return last.slice(at, stop === undefined ? last.length : stop);
    };
    const notes = last.slice(Math.max(0, last.indexOf('[Scene notes')));

    add('the turn starts from story turn ' + e.turn, before.turn === e.turn, 'state was at turn ' + before.turn);
    add('the place is ' + e.scene, before.scene === e.scene && section('Setting').includes(e.scene), 'state: ' + (before.scene || '(none)') + '; setting block: ' + (section('Setting').split('\n')[1] || '(none)'));
    const onStage = section('In the scene now');
    const cast = e.present.every((n) => onStage.includes('**' + n + '**')) && before.presentNames.slice().sort().join('|') === e.present.slice().sort().join('|');
    add('on stage: ' + (e.present.join(', ') || 'nobody'), cast, 'state: ' + (before.presentNames.join(', ') || 'nobody'));
    const strangers = StateProbes.ABSENT.map((a) => a.name).concat(['Elena']).filter((n) => !e.present.includes(n) && onStage.includes('**' + n + '**'));
    add('nobody else is listed on stage', !strangers.length, strangers.join(', ') || 'clean');
    if (e.absentKnown) {
      const off = section('Off stage');
      for (const a of StateProbes.ABSENT) {
        const line = off.split('\n').find((l) => l.includes('**' + a.name + '**')) || '';
        add(a.name + ' is off stage with a known whereabouts', !!line && a.where.test(line), line.trim() || 'no off-stage line');
      }
    }
    if (e.noPressure) add('no pressure line is handed over', !/Pressure \(/.test(notes), (notes.match(/Pressure \([^\n]*/) || ['none'])[0]);
    if (e.pressure) add('the pressure of that moment is handed over', notes.includes(e.pressure), (notes.match(/Pressure \([^\n]*/) || ['none'])[0]);
    add('the lunch thread is ' + (e.turn >= 6 ? 'closed' : 'open'), (e.turn >= 6) !== all.includes(RestoredStory.HUNGER_THREAD), all.includes(RestoredStory.HUNGER_THREAD) ? 'listed' : 'not listed');
    if (e.openThread) add('the open question is the film', notes.includes(e.openThread) || section('Story so far').includes(e.openThread), e.openThread);
    if (e.historyTurns !== null && e.historyTurns !== undefined) {
      add('the history is the ' + e.historyTurns + ' turns before this one', history.length === e.historyTurns * 2, history.length + ' messages');
      const turns = RestoredStory.turns();
      const wrong = history.findIndex((m, i) => {
        const t = turns[Math.floor(i / 2)];
        return !t || text(m).trim() !== (i % 2 === 0 ? t.player : t.reply).trim();
      });
      add('every history message is the stored one, in order', wrong < 0, wrong < 0 ? 'all match' : 'message ' + (wrong + 1) + ' differs');
    }
    if (e.trimmed) {
      add('older turns were trimmed from the history', history.length < 24 && history.length >= 2, history.length + ' of 24 messages kept');
      add('the summary stands in for them', section('Story so far').includes('Juniper Cafe'), section('Story so far').slice(0, 80).replace(/\s+/g, ' '));
    }
    for (const s of e.inRequest || []) add('the request still says "' + s + '"', all.includes(s), all.includes(s) ? 'present' : 'missing');
    for (const s of e.notInRequest || []) add('nothing from the undone turns: "' + s + '"', !all.includes(s), all.includes(s) ? 'FOUND in the request' : 'absent');
    add('the newest message starts with the player\'s text', last.startsWith(probe.action.text || RestoredStory.turns()[(probe.action.turn || 1) - 1].player), last.slice(0, 50).replace(/\s+/g, ' '));
    add('no reasoning or old notes in the history', !/<think>|\[Scene notes|\[Story state/.test(history.map(text).join('\n')), 'checked ' + history.length + ' messages');
    return out;
  }

  static reply(probe, { reply, after }) {
    const r = (probe.expect && probe.expect.reply) || {};
    const out = [];
    const add = (name, ok, detail = '') => out.push({ name, ok: !!ok, detail });
    const text = String(reply || '');
    add('the model answered', !!text.trim(), text.trim() ? text.split(/\s+/).length + ' words' : 'empty');
    for (const re of r.mentions || []) add('the reply mentions ' + re, re.test(text), (text.match(re) || ['no match'])[0]);
    for (const re of r.avoids || []) add('the reply avoids ' + re, !re.test(text), (text.match(re) || ['clean'])[0]);
    const narration = text.replace(/"[^"]*"/g, ' ');
    add('the player is "you", not named in narration', !new RegExp('\\b' + RestoredStory.PLAYER + '\\b').test(narration), /\byou\b/i.test(narration) ? 'second person' : 'no "you" in narration');
    const tags = (text.match(/^\*\*\s*([^*\n:]{1,40}?)\s*:?\s*\*\*/gm) || []).map((t) => t.replace(/[*:]/g, '').trim());
    if (r.presentAfter) {
      const walkIns = tags.filter((t) => StateProbes.ABSENT.some((a) => a.name.toLowerCase().startsWith(t.toLowerCase()) || t.toLowerCase().startsWith(a.name.split(' ')[0].toLowerCase())));
      if (probe.id !== 'phone') add('nobody absent speaks in the room', !walkIns.length, walkIns.join(', ') || 'clean');
    }
    if (!after) { add('the bookkeeping recorded the turn', false, 'no state after the reply'); return out; }
    const names = after.presentNames;
    if (r.sceneAfter) add('afterwards the story is at ' + r.sceneAfter, after.scene === r.sceneAfter, after.scene || '(none)');
    if (r.sceneNotAfter) add('afterwards the story has left ' + r.sceneNotAfter, !!after.scene && after.scene !== r.sceneNotAfter, after.scene || '(none)');
    if (r.presentAfter) add('afterwards on stage: ' + r.presentAfter.join(', '), names.slice().sort().join('|') === r.presentAfter.slice().sort().join('|'), names.join(', ') || 'nobody');
    for (const n of r.presentAfterIncludes || []) add(n + ' is on stage afterwards', names.includes(n), names.join(', ') || 'nobody');
    for (const n of r.presentAfterExcludes || []) add(n + ' is not on stage afterwards', !names.includes(n), names.join(', ') || 'nobody');
    return out;
  }
}

module.exports = StateProbes;
