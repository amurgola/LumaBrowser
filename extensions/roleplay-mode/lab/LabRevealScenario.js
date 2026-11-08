const LabBodyScenario = require('./LabBodyScenario');

class LabRevealScenario {
  static NAME = 'reveal';
  static CONTEXT_WINDOW = 8192;

  static PREMISE = 'The morning after a river flood. Five neighbours who were pulled out of a drowning mill house in '
    + 'the night are drying out in a school gym turned shelter. The player, the neighbour who got them out, is '
    + 'looking after them until the medic reaches their corner.';

  static TURNS = [
    'Bram sits on a bench and I help him work his soaked work boots and socks off. He has been in them all night. I look at his feet.',
    'Edda tries to peel off her wet slippers and stockings and her hands will not manage it. I kneel and do it for her, then look at her feet.',
    'Joss cannot feel his legs, so I suggest we check them. He rolls up his trouser legs and pulls his socks off. What do we see?',
    'Pip kicks off his wellies and socks and wiggles his toes at me. I take a look.',
    'Sela eases her trainers off and puts her feet up on a crate. I look at her ankles.',
    'I hand Bram a towel and he dries his hands. I look at his hands properly for the first time.',
    'The tea urn finally works. I fetch everyone a mug and we sit in the noise of the gym for a while. I ask Pip what he thinks happens to the mill house now.',
    'A volunteer brings dry clothes in a cardboard box. I sort out what fits whom while the others talk about where they will stay tonight.',
    'Someone has a radio and the news says the river is falling. I let everyone listen and watch their faces.',
    'The medic finally reaches our corner and asks to see feet first. Bram pulls his socks off again for her. I watch and tell her what his feet were like last night.',
    'The medic kneels by Joss and asks what his legs looked like when we checked them. I let Joss answer and watch.',
    'The medic looks at Edda\'s feet and Sela\'s ankles and asks if anything has changed since last night. I listen to their answers.',
  ];

  static REVEAL_TURNS = [1, 2, 3, 4, 5, 6];
  static RECALL_TURNS = [10, 11, 12];

  static build() {
    return {
      name: LabRevealScenario.NAME,
      data: LabRevealScenario.data(),
      turns: LabRevealScenario.TURNS.slice(),
      facts: [
        { id: 'chair', label: 'Joss uses a wheelchair (T10 spinal injury)', keywords: ['chair', 'wheelchair', 'legs'], askTurn: 11 },
      ],
      judges: ['reveal'],
      contextWindow: LabRevealScenario.CONTEXT_WINDOW,
      revealTurns: LabRevealScenario.REVEAL_TURNS.slice(),
      recallTurns: LabRevealScenario.RECALL_TURNS.slice(),
    };
  }

  static data() {
    const d = LabBodyScenario.data();
    d.scenario = LabRevealScenario.PREMISE;
    d.tone = 'quiet, close, observant; plain physical detail and dry warmth';
    const wet = { edda: 'damp cardigan, wool skirt, wet slippers, stockings', bram: 'damp flannel shirt, braces, soaked work boots',
      pip: 'pyjamas under a raincoat, wellies', sela: 'maternity dress, cardigan, wet trainers', joss: 'damp hoodie, cargo trousers, wet socks, fingerless gloves' };
    for (const c of d.characters) {
      c.currentOutfitDesc = wet[c.id] || c.currentOutfitDesc;
      c.state = { present: true, condition: 'soaked through and cold after a night in the flood' };
      c.chronicle = { arc: '', beats: [{ turn: 0, text: c.name + ' was pulled out of the flooded mill house in the night by the player.' }] };
    }
    d.scenes = [{ id: 'gym', name: 'the shelter', description: 'a school gym turned flood shelter: camp beds, wet coats on radiators, a tea urn, linoleum floor, the noise of a hundred people', bg: null }];
    d.activeSceneId = 'gym';
    d.currentState = { sceneId: 'gym', characters: d.characters.map((c) => ({ charId: c.id, name: c.name, present: true, emotion: 'exhausted', outfitDesc: c.currentOutfitDesc })) };
    d.story = {
      turn: 0, clock: { day: 2, timeOfDay: 'early morning', weather: 'rain easing' },
      summary: 'In the night the levee failed and the river filled the mill house. The player got Edda, Bram, Pip, Sela and Joss up the stairs, through the dark and out of a small window into a rescue boat. They spent hours wet and cold before reaching the shelter.',
      summaryTurn: 0,
      ledger: [{ turn: 0, messageId: null, kind: 'event', text: 'Everyone was rescued from the flooded mill house by boat in the night.', who: [] }],
      threads: [{ text: 'where the household goes now the mill house is flooded', open: true, turn: 0 }],
    };
    return d;
  }

  static canned() {
    return LabBodyScenario.canned();
  }
}

module.exports = LabRevealScenario;
