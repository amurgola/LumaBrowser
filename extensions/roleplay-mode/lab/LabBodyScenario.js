class LabBodyScenario {
  static NAME = 'body';

  static PREMISE = 'A river town at night. The levee upstream has failed and the water is rising through the old '
    + 'mill house where five neighbours sheltered from the storm. The player, a neighbour, has to get everyone up '
    + 'to the loft and out before the ground floor goes under.';

  static FACTS = [
    { id: 'chair', label: 'Joss uses a wheelchair (T10 spinal injury)', keywords: ['chair', 'wheelchair', 'legs'], askTurn: 10 },
    { id: 'pregnant', label: 'Sela is eight months pregnant', keywords: ['pregnan', 'baby', 'belly', 'bump'], askTurn: 10 },
    { id: 'hands', label: 'Edda has arthritic hands', keywords: ['hand', 'knuckle', 'finger', 'grip'], askTurn: 9 },
  ];

  static TURNS = [
    'Water is sliding in under the door and across the flagstones. "Everyone up the stairs, now. Go!" I grab the lantern and watch how each of them gets moving.',
    'I ask Bram to carry Joss up the stairs while I bring the wheelchair behind them. "Joss, tell him how you want to be lifted."',
    'Edda is still at the bottom of the steep stairs with her cane. I go back down and offer her my arm.',
    'In the upstairs room there is a ceiling hatch to the loft, small and high. Pip says he can get through it and fetch the rope from up there. I boost him up.',
    'The lantern gutters and dies. It is pitch black. "Nobody move. Is anyone hurt? Tell me where you are."',
    'An hour later the water is over the top stair and the room is freezing. Sela has gone quiet. I crouch beside her and ask how she is doing.',
    'A rescue boat bumps against the outside wall below the window. The window is small, chest high, and the boat is a drop of about a metre below it. I tell everyone we go out one at a time and ask who should go first.',
    'Bram is last. He gets one shoulder and his head through the window frame and stops. I ask him if he can make it.',
    'In the boat, Pip is shaking hard and Edda is trying to hold the side of the boat. I check on both of them.',
    'At the shelter in the school gym, with blankets and tea, I ask each of them in turn how they are holding up after tonight.',
  ];

  static build() {
    return {
      name: LabBodyScenario.NAME,
      data: LabBodyScenario.data(),
      turns: LabBodyScenario.TURNS.slice(),
      facts: LabBodyScenario.FACTS.map((f) => Object.assign({}, f)),
      judges: ['physicality'],
    };
  }

  static data() {
    const c = (id, name, seed, description, appearance, outfit, profile) => ({
      id, name, seed, description, appearance, currentOutfitDesc: outfit, outfits: [], art: null, profile,
      chronicle: { arc: '', beats: [] }, state: { present: true },
    });
    return {
      version: 2,
      scenario: LabBodyScenario.PREMISE,
      tone: 'grounded, tense, warm under pressure; plain physical detail',
      lengthMode: 'balanced',
      protagonist: { name: 'Rook', pronouns: 'they/them', appearance: 'adult neighbour, average height, wet through', persona: 'a practical neighbour who takes charge' },
      characters: [
        c('edda', 'Edda', 21, 'a 78 year old retired schoolteacher with arthritis and cataracts, sharp tongued',
          'tiny and stooped, white hair in a bun, swollen knuckles, cloudy eyes, walks with a cane', 'cardigan, wool skirt, slippers',
          { voice: 'precise, schoolmistress diction; "Don\'t fuss."', wants: 'not to be a burden', hides: 'how little she can see in low light', tells: ['taps her cane twice before she moves'], bonds: { user: 'fond' } }),
        c('bram', 'Bram', 22, 'a retired dockworker, enormously big and strong, with bad knees',
          '201 cm and about 140 kg, barrel chest, huge hands, knee braces under his trousers', 'flannel shirt, braces, work boots',
          { voice: 'few words, rumbling; "Aye."', wants: 'to be useful', hides: 'his knees are worse than he lets on', tells: ['rubs his knee when he thinks no one sees'], bonds: { user: 'loyal' } }),
        c('pip', 'Pip', 23, 'Sela\'s nine year old son, small for his age, fearless and fast',
          'skinny, about 130 cm, scabbed knees, too-big jumper', 'pyjamas under a raincoat, wellies',
          { voice: 'chatters, asks questions in strings; "Can I? Can I?"', wants: 'to be the hero', hides: 'he is scared of the dark', tells: ['talks faster when scared'], bonds: { user: 'admiring' } }),
        c('sela', 'Sela', 24, 'Pip\'s mother, a nurse, eight months pregnant with her second child',
          'tall, heavily pregnant, swollen ankles, hair tied back', 'maternity dress, cardigan, trainers',
          { voice: 'calm and practical, nurse\'s briskness; "Breathe for me."', wants: 'to keep Pip safe', hides: 'she has been having tightenings for an hour', tells: ['presses a hand to the small of her back'], bonds: { user: 'trusting' } }),
        c('joss', 'Joss', 25, 'a 29 year old mechanic, paraplegic from a T10 spinal injury after a fall, uses a manual wheelchair, very strong upper body',
          'broad shoulders, muscular arms, lean legs, sits in a sport wheelchair', 'hoodie, cargo trousers, fingerless gloves',
          { voice: 'dry jokes, blunt, hates being handled; "I\'ve got it."', wants: 'to be treated as capable', hides: 'he cannot feel when his legs are cold or hurt', tells: ['grips his push rims when tense'], bonds: { user: 'easy' } }),
      ],
      scenes: [{ id: 'mill', name: 'the mill house', description: 'stone ground floor, steep narrow wooden stairs, an upstairs room with a small window over the river and a ceiling hatch to the loft', bg: null }],
      activeSceneId: 'mill',
      currentState: {
        sceneId: 'mill',
        characters: ['Edda', 'Bram', 'Pip', 'Sela', 'Joss'].map((name) => ({ charId: name.toLowerCase(), name, present: true, emotion: 'alarmed', outfitDesc: '' })),
      },
      story: {
        turn: 0, clock: { day: 1, timeOfDay: 'night', weather: 'storm' }, summary: '', summaryTurn: 0,
        ledger: [{ turn: 0, messageId: null, kind: 'event', text: 'The levee upstream failed and the river is coming into the mill house.', who: [] }],
        threads: [{ text: 'get everyone out before the house floods', open: true, turn: 0 }],
      },
      options: { autoImage: false, sceneBackground: false, autoAvatarArt: false, prosePolish: false },
      images: {},
    };
  }

  static canned() {
    return {
      stage: JSON.stringify({
        newCharacters: [],
        present: ['Edda', 'Bram', 'Pip', 'Sela', 'Joss'].map((name) => ({ name, present: true, emotion: 'alarmed', outfit: '', outfitChanged: false })),
        events: [], clock: { advance: 'none' }, threads: { opened: [], closed: [] },
      }),
      profile: '{}',
      consolidate: '{}',
      default: '{}',
    };
  }
}

module.exports = LabBodyScenario;
