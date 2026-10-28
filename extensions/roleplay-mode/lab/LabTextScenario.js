class LabTextScenario {
  static PREMISE = 'A harbour town under curfew. Smugglers run the docks at night and the night watch answers to '
    + 'whoever pays. The player, a courier, arrived this evening carrying a sealed letter for the harbourmaster.';

  static FACTS = [
    { id: 'scar', label: 'Mara has a scar across the back of her left hand', keywords: ['scar'], askTurn: 7 },
    { id: 'debt', label: 'Teo owes the player for the letter', keywords: ['debt', 'owe', 'owes'], askTurn: 8 },
    { id: 'key', label: 'The customs-house key was stolen at the start', keywords: ['key'], askTurn: 9 },
    { id: 'death', label: 'Old Mott died on turn 5 and stays dead', keywords: ['Mott'], deathTurn: 5, character: 'Mott' },
  ];

  static TURNS = [
    'I step onto the dock and look for the harbourmaster. "Teo? I have a letter for you."',
    'I hand Teo the letter and glance at the woman beside him. "And you are?"',
    'I ask Mara what happened to the customs-house key she keeps touching her pocket about.',
    'I agree to help Mara find whoever took the key, if Teo covers my bed for the night.',
    'Old Mott, the lamplighter, staggers over clutching his chest and collapses at our feet. I kneel to check him.',
    'I tell Teo he owes me for this letter, and that I will collect. Then I follow Mara toward the warehouses.',
    'As we walk I take Mara\'s left hand to steady her on the wet planks and look down at it. What do I see?',
    'I ask Teo, when we get back, exactly what he owes me and when he plans to pay.',
    'I ask Mara to recap what we know about the missing key so far, in her own words.',
    'I look around the dock for Mott and ask who is lighting the lamps tonight.',
  ];

  static build() {
    return {
      data: LabTextScenario.data(),
      turns: LabTextScenario.TURNS.slice(),
      facts: LabTextScenario.FACTS.map((f) => Object.assign({}, f)),
    };
  }

  static data() {
    return {
      version: 2,
      scenario: LabTextScenario.PREMISE,
      tone: 'dry noir, clipped sentences, wry humour under the menace',
      lengthMode: 'balanced',
      protagonist: { name: 'Rook', pronouns: 'they/them', appearance: 'rain-soaked courier in a grey oilskin', persona: 'a courier who asks too many questions' },
      characters: [
        {
          id: 'mara', name: 'Mara', seed: 11,
          description: 'a guarded informant who sells what she hears on the docks',
          appearance: 'red bob, green eyes, a scar across the back of her left hand',
          currentOutfitDesc: 'trench coat, grey scarf', outfits: [], art: null,
          profile: { voice: 'clipped; answers questions with questions; "Spare me."', wants: 'to get out of town before the smugglers collect', hides: 'she took the customs-house key herself', tells: ['rubs the scar on her left hand when lying', 'checks the exits before she sits'], bonds: { user: 'wary' } },
          chronicle: { arc: '', beats: [] },
          state: { present: true },
        },
        {
          id: 'teo', name: 'Teo', seed: 12,
          description: 'the harbourmaster, tired and careful, who pays the watch to look away',
          appearance: 'broad, grey-bearded, oilskin coat',
          currentOutfitDesc: 'oilskin coat, wool cap', outfits: [], art: null,
          profile: { voice: 'slow, formal, never swears; "In due course."', wants: 'to keep the docks quiet until the curfew lifts', hides: 'the letter names him', tells: ['polishes his cap badge with a thumb', 'counts coins he is not spending'], bonds: { user: 'curious' } },
          chronicle: { arc: '', beats: [] },
          state: { present: true },
        },
        {
          id: 'mott', name: 'Mott', seed: 13,
          description: 'Old Mott, the lamplighter, half deaf and all gossip',
          appearance: 'stooped, white stubble, lamp pole',
          currentOutfitDesc: 'patched coat', outfits: [], art: null,
          profile: { voice: 'loud, repeats himself', wants: 'company', hides: '', tells: ['taps the lamp pole'], bonds: {} },
          chronicle: { arc: '', beats: [] },
          state: { present: false },
        },
      ],
      scenes: [{ id: 'dock', name: 'the dock', description: 'wet planks, fog, one lit lamp, the customs house dark behind', bg: null }],
      activeSceneId: 'dock',
      currentState: { sceneId: 'dock', characters: [{ charId: 'mara', name: 'Mara', present: true, emotion: 'wary', outfitDesc: 'trench coat, grey scarf' }, { charId: 'teo', name: 'Teo', present: true, emotion: 'tired', outfitDesc: 'oilskin coat, wool cap' }] },
      story: {
        turn: 0, clock: { day: 1, timeOfDay: 'evening', weather: 'fog' }, summary: '', summaryTurn: 0,
        ledger: [{ turn: 0, messageId: null, kind: 'event', text: 'The customs-house key was stolen this afternoon.', who: [] }],
        threads: [{ text: 'who took the customs-house key', open: true, turn: 0 }],
      },
      options: { autoImage: false, sceneBackground: false, autoAvatarArt: false, prosePolish: false },
      images: {},
    };
  }

  static canned() {
    return {
      stage: JSON.stringify({
        newCharacters: [], present: [
          { name: 'Mara', present: true, emotion: 'wary', outfit: 'trench coat, grey scarf', outfitChanged: false },
          { name: 'Teo', present: true, emotion: 'tired', outfit: 'oilskin coat, wool cap', outfitChanged: false },
        ],
        events: [], clock: { advance: 'none' }, threads: { opened: [], closed: [] },
      }),
      profile: '{}',
      consolidate: '{}',
      default: '{}',
    };
  }
}

module.exports = LabTextScenario;
