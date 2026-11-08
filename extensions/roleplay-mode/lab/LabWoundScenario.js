class LabWoundScenario {
  static NAME = 'wound';

  static PREMISE = 'The borderlands, late autumn. Raiders hit a small patrol at a river ford. The player, a '
    + 'man-at-arms, rides with Ser Aldric, his squire Wren and Brother Odo, a monk who serves as their surgeon.';

  static TURNS = [
    'The raider\'s axe comes down on Ser Aldric\'s sword arm just below the elbow. I see it land.',
    'I drag Aldric back out of the water onto the bank and look at his arm.',
    '"Wren, your belt, round his arm above the wound, now! Odo!" I press down on it with both hands while they come.',
    'Odo says the arm cannot be saved and the stump must be burned shut. I kneel on Aldric\'s chest and hold him down while Odo works with the iron from the fire.',
    'The raider Wren stabbed in the belly is lying by the water, groaning. I walk over and look at him.',
    'An hour later the raider has gone quiet. I go and check him.',
    'Night in camp. I sit beside Aldric by the fire and ask him how he feels.',
    'Three days later Aldric\'s bandage stinks and he is shaking under his cloak. I unwrap the stump to look.',
  ];

  static build() {
    return {
      name: LabWoundScenario.NAME,
      data: LabWoundScenario.data(),
      turns: LabWoundScenario.TURNS.slice(),
      facts: [{ id: 'arm', label: 'Aldric lost his sword arm below the elbow', keywords: ['arm', 'stump'], askTurn: 8 }],
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
      scenario: LabWoundScenario.PREMISE,
      tone: 'hard, unglamorous, close; plain physical detail',
      lengthMode: 'balanced',
      protagonist: { name: 'Rook', pronouns: 'they/them', appearance: 'a man-at-arms in a mail shirt', persona: 'a steady soldier who has seen battle' },
      characters: [
        c('aldric', 'Aldric', 31, 'Ser Aldric, a 38 year old knight, veteran of many fights, proud and stubborn',
          'tall, heavy shoulders, close-cropped grey-shot hair, an old scar through one eyebrow', 'mail hauberk, padded gambeson, surcoat, leather gloves',
          { voice: 'curt, commanding; swears by the saints', wants: 'to keep his men alive', hides: 'he is afraid of being useless', tells: ['clenches his jaw'], bonds: { user: 'trusts' } }),
        c('wren', 'Wren', 32, 'Aldric\'s squire, 17, quick and frightened, trying to be brave',
          'wiry, freckled, too-long sandy hair', 'quilted jack, wool hose, riding boots',
          { voice: 'fast, cracks when scared', wants: 'to make his knight proud', hides: 'he has never killed a man before today', tells: ['wipes his hands on his thighs'], bonds: { user: 'looks up to' } }),
        c('odo', 'Odo', 33, 'Brother Odo, a 55 year old monk who has served as a field surgeon for twenty years',
          'stout, tonsured, thick forearms, ink and old blood under his nails', 'brown habit hitched up, leather apron',
          { voice: 'calm, dry, scripture and practicality', wants: 'to save who can be saved', hides: '', tells: ['murmurs prayers while he works'], bonds: { user: 'respects' } }),
      ],
      scenes: [{ id: 'ford', name: 'the ford', description: 'a shallow stony river crossing, cold and fast, muddy banks, bare trees, a fire being kindled on the bank', bg: null }],
      activeSceneId: 'ford',
      currentState: { sceneId: 'ford', characters: ['Aldric', 'Wren', 'Odo'].map((name) => ({ charId: name.toLowerCase(), name, present: true, emotion: 'fierce', outfitDesc: '' })) },
      story: {
        turn: 0, clock: { day: 1, timeOfDay: 'afternoon', weather: 'cold, overcast' }, summary: '', summaryTurn: 0,
        ledger: [{ turn: 0, messageId: null, kind: 'event', text: 'Raiders ambushed the patrol at the ford.', who: [] }],
        threads: [{ text: 'survive the raid at the ford', open: true, turn: 0 }],
      },
      options: { autoImage: false, sceneBackground: false, autoAvatarArt: false, prosePolish: false },
      images: {},
    };
  }

  static canned() {
    return {
      stage: JSON.stringify({
        newCharacters: [], present: ['Aldric', 'Wren', 'Odo'].map((name) => ({ name, present: true, emotion: 'grim', outfit: '', outfitChanged: false })),
        events: [], clock: { advance: 'none' }, threads: { opened: [], closed: [] },
      }),
      profile: '{}', consolidate: '{}', default: '{}',
    };
  }
}

module.exports = LabWoundScenario;
