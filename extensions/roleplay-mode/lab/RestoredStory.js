class RestoredStory {
  static PLAYER = 'Daniel';
  static OPENING = '(Begin the scene: set the stage and introduce the characters.)';
  static SCENES = Object.freeze({ office: 'the office', cafe: 'the cafe', bus: 'the bus', stairs: 'the stairwell', home: 'the living room' });

  static setup(options = {}) {
    return {
      protagonist: { name: RestoredStory.PLAYER, pronouns: 'he/him', appearance: '', persona: 'an insurance claims adjuster in his thirties' },
      lengthMode: 'balanced', llmModel: '', llmCtx: '', sideModel: '', baseModel: '', editModel: '',
      characters: [], scenes: [],
      options: Object.assign({ imageProfile: 'balanced', harmonizeMode: 'auto', harmonize: false, harmonizeStrength: 0 }, options),
      diagnostics: {},
      scenario: 'An ordinary weekday in a small city. Daniel works at an insurance office downtown and lives with his '
        + 'wife Elena in a third-floor flat on Alder Street. Nothing strange happens: this is a quiet story about one day.',
      tone: 'plain and warm', activeSceneId: null, images: {},
    };
  }

  static _present(name, fields = {}) {
    return Object.assign({
      name, present: true, emotion: 'calm', intent: '', condition: '', bondUser: 'friendly', bondChange: '', beat: '',
      leftTo: '', revealed: false, noticed: [], outfit: '', outfitChanged: false,
    }, fields);
  }

  static _stage({ newCharacters = [], location, present = [], events = [], clock = {}, threads = {}, pressure = '' }) {
    return {
      newCharacters: newCharacters.map((c) => Object.assign({ looks: '', personality: '', was: '' }, c)),
      location,
      present,
      events: events.map((e) => Object.assign({ kind: 'event', who: [] }, e)),
      clock: Object.assign({ advance: 'none', timeOfDay: '', weather: '' }, clock),
      threads: Object.assign({ opened: [], advanced: [], closed: [] }, threads),
      pressure,
    };
  }

  static LUNCH_PRESSURE = 'Daniel will be late back unless he leaves the cafe before one.';
  static HUNGER_THREAD = 'Whether Daniel gets lunch before his break ends at one';
  static MOVIE_THREAD = 'Which film Daniel and Elena watch tonight';

  static turns() {
    const S = RestoredStory.SCENES;
    const P = RestoredStory._present;
    const stage = RestoredStory._stage;
    return [
      {
        player: RestoredStory.OPENING,
        reply: 'The claims floor of Harlow Mutual, a few minutes past noon. Your stomach has been growling since eleven and the vending machine ate your last coins.\n\n'
          + 'At the next desk Marcus Bell, a broad man with a loosened green tie and rolled sleeves, looks up from the Hendry file.\n\n'
          + '**Marcus:** "You sound like a drain. Go and eat. Break ends at one, and Carol counts."',
        stage: stage({
          newCharacters: [{ name: 'Marcus Bell', looks: 'broad man, loosened green tie, rolled shirt sleeves', personality: 'dry, easygoing' }],
          location: { name: S.office, desc: 'the claims floor of Harlow Mutual, rows of desks', isNew: true },
          present: [P('Marcus Bell', { emotion: 'amused', intent: 'to finish the Hendry file', beat: 'Told the player to go and eat before the break ended at one.', outfit: 'white shirt, loosened green tie, grey trousers' })],
          events: [{ text: 'Daniel\'s lunch break began at noon, hungry, with the break ending at one.', who: ['Daniel', 'Marcus Bell'] }],
          clock: { timeOfDay: 'midday' },
          threads: { opened: [RestoredStory.HUNGER_THREAD] },
        }),
      },
      {
        player: 'I grab my coat and walk over to the Juniper Cafe.',
        reply: 'You leave Marcus bent over the Hendry file and walk the two blocks to the Juniper Cafe. The bell over the door rings. It is warm inside and smells of toast.\n\n'
          + 'Behind the counter a young woman in a mustard apron, dark hair in a braid, wipes down the espresso machine. Her name tag says Priya.\n\n'
          + '**Priya:** "Hi there. What can I get you?"',
        stage: stage({
          newCharacters: [{ name: 'Priya Nair', looks: 'young woman, dark braid, mustard apron', personality: 'brisk, friendly' }],
          location: { name: S.cafe, desc: 'the Juniper Cafe, a small corner cafe with a window table', isNew: true },
          present: [
            P('Marcus Bell', { present: false, leftTo: 'stayed at his desk at the office with the Hendry file' }),
            P('Priya Nair', { emotion: 'cheerful', intent: 'to take the order', beat: 'Greeted the player at the counter.', outfit: 'mustard apron, black t-shirt, jeans' }),
          ],
          events: [{ kind: 'move', text: 'Daniel walked from the office to the Juniper Cafe for lunch.', who: ['Daniel'] }],
          clock: { advance: 'minutes', timeOfDay: 'midday' },
          threads: { advanced: [RestoredStory.HUNGER_THREAD] },
        }),
      },
      {
        player: 'I order a turkey and swiss on rye.',
        reply: '**Priya:** "Turkey and swiss on rye, coming up. That is nine fifty." She taps the card reader and makes a face. "And this thing died an hour ago, so it is cash only today. Sorry."\n\n'
          + 'She starts laying out the bread while she waits.',
        stage: stage({
          location: { name: S.cafe, desc: '', isNew: false },
          present: [P('Priya Nair', { emotion: 'apologetic', intent: 'to make the sandwich', beat: 'Took the order for a turkey and swiss on rye and said the card reader was broken.', outfit: 'mustard apron, black t-shirt, jeans' })],
          events: [{ text: 'Daniel ordered a turkey and swiss on rye for nine fifty; the cafe\'s card reader was broken, cash only.', who: ['Daniel', 'Priya Nair'] }],
          clock: { timeOfDay: 'midday' },
          threads: { advanced: [RestoredStory.HUNGER_THREAD] },
        }),
      },
      {
        player: 'I pay with a twenty and apologise for not having anything smaller.',
        reply: '**Priya:** "A twenty is fine." She counts ten fifty into your hand, then drops an oatmeal cookie in a paper bag on top of the sandwich. "On the house, for the card reader."\n\n'
          + 'She slides the plate across. The window table is free.',
        stage: stage({
          location: { name: S.cafe, desc: '', isNew: false },
          present: [P('Priya Nair', { emotion: 'cheerful', bondUser: 'warm', bondChange: 'the player was patient about the card reader', beat: 'Gave the player change and a free oatmeal cookie.', outfit: 'mustard apron, black t-shirt, jeans' })],
          events: [{ text: 'Daniel paid cash with a twenty and Priya gave him a free oatmeal cookie for the trouble.', who: ['Daniel', 'Priya Nair'] }],
          clock: { timeOfDay: 'midday' },
          threads: { advanced: [RestoredStory.HUNGER_THREAD] },
        }),
        pressure: { pressure: RestoredStory.LUNCH_PRESSURE, thread: 'How Daniel\'s ordinary day goes' },
      },
      {
        player: 'I take the window table and start eating.',
        reply: 'You are halfway through the first half when the bell rings and Marcus comes in, tie flapping, and drops into the chair across from you.\n\n'
          + '**Marcus:** "Knew I would find you here." He rubs the back of his neck. "Listen. The twenty from poker last week. I am short until payday. Friday, I promise."',
        stage: stage({
          location: { name: S.cafe, desc: '', isNew: false },
          present: [
            P('Priya Nair', { emotion: 'busy', outfit: 'mustard apron, black t-shirt, jeans' }),
            P('Marcus Bell', { emotion: 'sheepish', intent: 'to buy time on his debt', beat: 'Joined the player at the cafe and promised to repay twenty dollars from poker on Friday.', outfit: 'white shirt, loosened green tie, grey trousers' }),
          ],
          events: [{ kind: 'promise', text: 'Marcus Bell owes Daniel twenty dollars from last week\'s poker and promised to pay it back on Friday.', who: ['Marcus Bell', 'Daniel'] }],
          clock: { advance: 'minutes', timeOfDay: 'midday' },
          pressure: RestoredStory.LUNCH_PRESSURE,
        }),
      },
      {
        player: 'I tell him Friday is fine and finish my sandwich.',
        reply: '**Marcus:** "You are a saint." He checks his watch and stands. "Twelve forty. I am heading back before Carol starts counting heads."\n\n'
          + 'He goes. You finish the last of the rye and the cookie. For the first time since eleven you are not hungry.',
        stage: stage({
          location: { name: S.cafe, desc: '', isNew: false },
          present: [
            P('Priya Nair', { emotion: 'busy', outfit: 'mustard apron, black t-shirt, jeans' }),
            P('Marcus Bell', { present: false, emotion: 'relieved', leftTo: 'went back to the office', beat: 'Thanked the player and left for the office at twelve forty.' }),
          ],
          events: [{ text: 'Daniel finished his sandwich and was no longer hungry.', who: ['Daniel'] }],
          clock: { advance: 'minutes', timeOfDay: 'midday' },
          threads: { closed: [RestoredStory.HUNGER_THREAD] },
          pressure: RestoredStory.LUNCH_PRESSURE,
        }),
      },
      {
        player: 'I walk back to the office and work until five.',
        reply: 'You are at your desk by ten to one. The afternoon goes to two water-damage claims and a long phone call.\n\n'
          + 'At five you shut the laptop. Marcus is still at his desk, sleeves rolled higher, the Hendry file spread across it.\n\n'
          + '**Marcus:** "Go home. I am here till seven with this thing."',
        stage: stage({
          location: { name: S.office, desc: '', isNew: false },
          present: [P('Marcus Bell', { emotion: 'tired', intent: 'to finish the Hendry claim tonight', beat: 'Told the player he was staying at the office until seven to finish the Hendry claim.', outfit: 'white shirt, loosened green tie, grey trousers' })],
          events: [{ kind: 'move', text: 'Daniel returned to the office before one and worked until five.', who: ['Daniel'] }],
          clock: { advance: 'hours', timeOfDay: 'evening' },
          pressure: '',
        }),
      },
      {
        player: 'I say goodnight and take the 14 bus home.',
        reply: 'The 14 is half empty. You get a seat by the heater and watch the shop fronts go by, the cafe among them, lights still on.\n\n'
          + 'Twenty minutes later the bus turns onto Alder Street.',
        stage: stage({
          location: { name: S.bus, desc: 'the number 14 bus heading out of downtown', isNew: true },
          present: [P('Marcus Bell', { present: false, leftTo: 'stayed late at the office, until seven, on the Hendry claim' })],
          events: [{ kind: 'move', text: 'Daniel left the office at five and took the 14 bus home.', who: ['Daniel'] }],
          clock: { advance: 'minutes', timeOfDay: 'evening' },
        }),
      },
      {
        player: 'I get off at Alder Street and climb the stairs.',
        reply: 'On the second-floor landing Mrs. Okafor, small and straight-backed in a blue cardigan, is watering the ferns outside flat 2B.\n\n'
          + '**Mrs. Okafor:** "Daniel. Just the man. I am going to my son in Leeds for the weekend. Would you water these, Saturday and Sunday? I will give you the spare key."',
        stage: stage({
          newCharacters: [{ name: 'Mrs. Okafor', looks: 'small, straight-backed older woman, blue cardigan', personality: 'direct, neighbourly' }],
          location: { name: S.stairs, desc: 'the stairwell of the Alder Street building, second-floor landing', isNew: true },
          present: [P('Mrs. Okafor', { emotion: 'hopeful', intent: 'to get her plants watered this weekend', bondUser: 'neighbourly', beat: 'Asked the player to water her plants on Saturday and Sunday while she visits her son in Leeds.', outfit: 'blue cardigan, grey skirt, slippers' })],
          events: [{ text: 'Mrs. Okafor of flat 2B asked Daniel to water her plants this weekend while she visits her son in Leeds.', who: ['Mrs. Okafor', 'Daniel'] }],
          clock: { advance: 'minutes', timeOfDay: 'evening' },
        }),
        pressure: { pressure: '', thread: '' },
      },
      {
        player: 'I promise I will water them and take the key.',
        reply: '**Mrs. Okafor:** "Bless you." She presses a brass key on a red ribbon into your palm. "Saturday and Sunday. Not too much for the big fern."\n\n'
          + 'She carries the watering can back into 2B and the door clicks shut. You climb the last flight.',
        stage: stage({
          location: { name: S.stairs, desc: '', isNew: false },
          present: [P('Mrs. Okafor', { present: false, emotion: 'pleased', bondUser: 'grateful', bondChange: 'the player agreed to water her plants', leftTo: 'went back into her flat, 2B, one floor below', beat: 'Gave the player her spare key on a red ribbon and went back into flat 2B.' })],
          events: [{ kind: 'promise', text: 'Daniel promised to water Mrs. Okafor\'s plants on Saturday and Sunday and took her spare key on a red ribbon.', who: ['Daniel', 'Mrs. Okafor'] }],
          clock: { timeOfDay: 'evening' },
        }),
      },
      {
        player: 'I go up to our flat and let myself in.',
        reply: 'The living room is lit by one lamp. Elena is on the sofa under the grey blanket, laptop closed beside her, a hand pressed to her temple.\n\n'
          + '**Elena:** "There you are." She smiles without lifting her head. "I have had a headache since three. Tell me about your day, and then I want to watch something and not think."',
        stage: stage({
          newCharacters: [{ name: 'Elena', looks: 'woman in her thirties, short dark curls, grey blanket around her shoulders', personality: 'warm, tired tonight' }],
          location: { name: S.home, desc: 'the living room of the third-floor flat, a sofa, one lamp lit', isNew: true },
          present: [P('Elena', { emotion: 'tired, glad', intent: 'to watch a film and rest', condition: 'a headache since three', bondUser: 'loving', beat: 'Welcomed the player home and asked about his day.', outfit: 'soft grey sweater, leggings, wool socks' })],
          events: [{ kind: 'move', text: 'Daniel came home to the flat, where Elena was resting on the sofa with a headache.', who: ['Daniel', 'Elena'] }],
          clock: { timeOfDay: 'evening' },
        }),
      },
      {
        player: 'I tell her about lunch and drop onto the sofa beside her.',
        reply: 'Elena listens with her eyes closed and laughs at the card reader.\n\n'
          + '**Elena:** "A free cookie. You do well out of other people\'s bad days." She opens the laptop and turns it toward you. "So. Paper Moonlight, which is a comedy and ninety minutes, or that thriller you keep on the list, Northbound. I vote comedy. My head votes comedy. You pick."',
        stage: stage({
          location: { name: S.home, desc: '', isNew: false },
          present: [P('Elena', { emotion: 'amused, tired', intent: 'to settle on a film, preferably the comedy', condition: 'a headache since three', bondUser: 'loving', beat: 'Listened to the player\'s day and offered a choice between the comedy Paper Moonlight and the thriller Northbound.', outfit: 'soft grey sweater, leggings, wool socks' })],
          events: [{ text: 'Elena offered a choice of films: the comedy Paper Moonlight or the thriller Northbound; she prefers the comedy.', who: ['Elena', 'Daniel'] }],
          clock: { timeOfDay: 'evening' },
          threads: { opened: [RestoredStory.MOVIE_THREAD] },
        }),
      },
    ];
  }

  static PROFILES = Object.freeze({
    'Marcus Bell': { summary: 'Daniel\'s desk neighbour at Harlow Mutual, dry and easygoing.', appearance: 'broad man, loosened green tie, rolled shirt sleeves', history: 'Has worked claims at Harlow Mutual for nine years.', voice: 'Short, dry sentences; teases. "You sound like a drain."', wants: 'to close the Hendry claim', hides: '', tells: ['rubs the back of his neck when embarrassed', 'checks his watch before he stands'], bondUser: 'friendly', bonds: {} },
    'Priya Nair': { summary: 'The barista at the Juniper Cafe, brisk and friendly.', appearance: 'young woman, dark braid, mustard apron', history: 'Works the lunch shift at the Juniper Cafe.', voice: 'Quick and bright; says sorry with a grin. "On the house."', wants: 'to get through the lunch rush', hides: '', tells: ['taps the dead card reader when she remembers it', 'wipes her hands on her apron before taking money'], bondUser: 'friendly', bonds: {} },
    'Mrs. Okafor': { summary: 'The neighbour in flat 2B, direct and neighbourly.', appearance: 'small, straight-backed older woman, blue cardigan', history: 'Has lived in flat 2B longer than anyone else in the building.', voice: 'Plain and certain; calls Daniel by his first name. "Just the man."', wants: 'her plants watered while she is away', hides: '', tells: ['holds the watering can in both hands when she asks a favour', 'nods once when a thing is settled'], bondUser: 'neighbourly', bonds: {} },
    Elena: { summary: 'Daniel\'s wife, warm and quick to laugh.', appearance: 'woman in her thirties, short dark curls', history: 'Married to Daniel for six years; works from home as a translator.', voice: 'Easy and teasing; finishes her point with a small joke. "My head votes comedy."', wants: 'a quiet evening and a film', hides: '', tells: ['presses a hand to her temple when the headache bites', 'tucks her feet under her on the sofa'], bondUser: 'loving', bonds: {} },
  });

  static SUMMARY = 'Where things stand: Daniel, an insurance claims adjuster, had lunch, worked the afternoon and is on his way up to his flat on Alder Street.\n'
    + 'What happened: Hungry at noon, the player walked to the Juniper Cafe, where Priya Nair served him a turkey and swiss on rye (cash only, the card reader was broken) and gave him a free oatmeal cookie. '
    + 'Marcus Bell joined him and promised to repay twenty dollars from poker on Friday. The player was back at the office before one and worked until five; Marcus Bell stayed late on the Hendry claim. '
    + 'The player took the 14 bus home. On the stairs Mrs. Okafor of flat 2B asked him to water her plants on Saturday and Sunday while she visits her son in Leeds, and gave him her spare key on a red ribbon.\n'
    + 'Who is where: Marcus Bell is at the office until seven. Priya Nair is at the Juniper Cafe. Mrs. Okafor is in flat 2B.\n'
    + 'Promises and debts: Marcus Bell owes the player twenty dollars, due Friday. The player promised to water Mrs. Okafor\'s plants on Saturday and Sunday.';

  static script({ fallbackNarrator = 'Nothing else happens for a moment.' } = {}) {
    const turns = RestoredStory.turns();
    const text = (m) => (typeof (m && m.content) === 'string' ? m.content : '');
    return {
      narrator: async (call) => {
        const last = text(call.messages[call.messages.length - 1]);
        const turn = turns.find((t) => last.startsWith(t.player));
        return turn ? turn.reply : fallbackNarrator;
      },
      side: async (call) => {
        const system = text(call.messages[0]);
        const user = text(call.messages[call.messages.length - 1]);
        const turn = turns.find((t) => user.includes(t.reply.slice(0, 80)));
        if (/stage manager/i.test(system)) return JSON.stringify(turn ? turn.stage : RestoredStory.quietStage(system));
        if (/casting director/i.test(system)) {
          const name = Object.keys(RestoredStory.PROFILES).find((n) => user.includes('Character: ' + n + '\n'));
          return name ? JSON.stringify(RestoredStory.PROFILES[name]) : '{}';
        }
        if (/story editor/i.test(system)) return JSON.stringify((turn && turn.pressure) || { pressure: '', thread: '' });
        if (/story record of an interactive roleplay/i.test(system)) return RestoredStory.SUMMARY;
        return '{}';
      },
    };
  }

  static quietStage(system) {
    const scene = (String(system).match(/Prior current scene: (.*)/) || [])[1] || '';
    const pressure = (String(system).match(/Pressure before this passage: (.*)/) || [])[1] || '';
    return RestoredStory._stage({
      location: { name: scene === '(unknown)' ? '' : scene, desc: '', isNew: false },
      pressure: pressure === '(none)' ? '' : pressure,
    });
  }
}

module.exports = RestoredStory;
