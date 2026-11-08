class LabJungleScenario {
  static NAME = 'jungle';

  static PREMISE = 'Lowland rainforest, the wet season. A survey party lost its boat and spent five days on foot; '
    + 'for the last three, two of them have had dysentery from bad water. The player, a field assistant, has just '
    + 'got Ines and Kofi to a small mission station run by Sister Agathe.';

  static TURNS = [
    'We stumble through the mission gate into the lamplight. I look properly at Ines and Kofi for the first time in days.',
    'Kofi doubles over and runs for the latrine again. I sit Ines on the step and give her the canteen.',
    'Ines admits she cannot remember the last time she peed. I ask her how she feels.',
    'Sister Agathe brings a basin, hot water and soap. I help Ines wash her hair and then peel off her socks to wash her feet.',
    'Kofi tries the broth the sister made and brings it straight back up. I hold his shoulders.',
    'That evening Ines, washed and in a borrowed shirt, sits close to me on the veranda and leans her head on my shoulder.',
    'Ines turns and kisses me.',
    'Before dawn Kofi is shaking under two blankets and burning hot. I sit with him.',
  ];

  static build() {
    return {
      name: LabJungleScenario.NAME,
      data: LabJungleScenario.data(),
      turns: LabJungleScenario.TURNS.slice(),
      facts: [{ id: 'sick', label: 'Kofi has dysentery', keywords: ['dysentery', 'sick', 'latrine', 'cramp'], askTurn: 8 }],
      judges: ['physicality'],
    };
  }

  static data() {
    const sick = 'unwashed for five days in the jungle, sick with dysentery for three days, dehydrated';
    return {
      version: 2,
      scenario: LabJungleScenario.PREMISE,
      tone: 'humid, tender, frank; plain physical detail and dry humour',
      lengthMode: 'balanced',
      protagonist: { name: 'Rook', pronouns: 'they/them', appearance: 'a field assistant, filthy and sunburnt', persona: 'practical, kind, still on their feet' },
      characters: [
        { id: 'ines', name: 'Ines', seed: 41, description: 'a 32 year old botanist, wry and stubborn, used to fieldwork',
          appearance: 'lean, sunburnt, long dark hair in a braid, insect bites up both arms', currentOutfitDesc: 'torn field shirt, cargo trousers, socks, boots',
          outfits: [], art: null, profile: { voice: 'dry, understated; "I have been worse." She has not.', wants: 'to sleep in a bed', hides: 'she is falling for the player', tells: ['laughs when it hurts'], bonds: { user: 'warm' } },
          chronicle: { arc: '', beats: [] }, state: { present: true, condition: sick } },
        { id: 'kofi', name: 'Kofi', seed: 42, description: 'a 35 year old river guide, big-voiced and steady, the sickest of them',
          appearance: 'broad, muscular, shaved head, a machete scar on his forearm', currentOutfitDesc: 'sweat-rotted t-shirt, shorts, rubber boots',
          outfits: [], art: null, profile: { voice: 'booming, jokes even now', wants: 'to get everyone home', hides: 'he blames himself for the boat', tells: ['rubs his scalp'], bonds: { user: 'brotherly' } },
          chronicle: { arc: '', beats: [] }, state: { present: true, condition: sick } },
        { id: 'agathe', name: 'Agathe', seed: 43, description: 'Sister Agathe, a 60 year old nun and nurse who has run the mission for decades',
          appearance: 'small, wiry, white habit, reading glasses on a cord', currentOutfitDesc: 'white habit, sandals',
          outfits: [], art: null, profile: { voice: 'brisk, kind, no nonsense', wants: 'to get fluids into them', hides: '', tells: ['pushes her glasses up'], bonds: { user: 'approving' } },
          chronicle: { arc: '', beats: [] }, state: { present: true } },
      ],
      scenes: [{ id: 'mission', name: 'the mission', description: 'a clearing with a whitewashed chapel, a well, a veranda with hammocks, a latrine hut, generator lamps, the jungle loud all around', bg: null }],
      activeSceneId: 'mission',
      currentState: { sceneId: 'mission', characters: ['Ines', 'Kofi', 'Agathe'].map((name) => ({ charId: name.toLowerCase(), name, present: true, emotion: 'exhausted', outfitDesc: '' })) },
      story: {
        turn: 0, clock: { day: 6, timeOfDay: 'dusk', weather: 'hot, humid, rain coming' }, summary: '', summaryTurn: 0,
        ledger: [{ turn: 0, messageId: null, kind: 'event', text: 'The party lost its boat and walked for five days; Ines and Kofi caught dysentery from bad water.', who: [] }],
        threads: [{ text: 'get Ines and Kofi well enough to travel', open: true, turn: 0 }],
      },
      options: { autoImage: false, sceneBackground: false, autoAvatarArt: false, prosePolish: false },
      images: {},
    };
  }

  static canned() {
    return {
      stage: JSON.stringify({
        newCharacters: [], present: ['Ines', 'Kofi', 'Agathe'].map((name) => ({ name, present: true, emotion: 'tired', outfit: '', outfitChanged: false })),
        events: [], clock: { advance: 'none' }, threads: { opened: [], closed: [] },
      }),
      profile: '{}', consolidate: '{}', default: '{}',
    };
  }
}

module.exports = LabJungleScenario;
