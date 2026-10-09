class LabTurn {
  static DEFAULT_OUTFIT = 'a simple everyday outfit';

  static build(data, options) {
    const char = (data.characters && data.characters[0]) || { name: 'the character', appearance: '', description: '', currentOutfitDesc: '' };
    const scene = (data.scenes || []).find((s) => s.id === data.activeSceneId) || (data.scenes || [])[0] || { name: 'the scene', description: 'an interior room' };
    const shot = Object.assign(
      { pose: 'sitting', facing: 'viewer', framing: 'close', focus: [char.name], group: false, contact: false, action: '', props: [] },
      (options && options.beat) || {},
    );
    return { content: LabTurn._content(char, scene), canned: LabTurn._canned(char, scene, shot), shot };
  }

  static _content(char, scene) {
    return [
      scene.description || ('The scene is set in ' + (scene.name || 'a room') + '.'),
      '',
      char.name + ' is seated nearby, taking in the moment.',
      '',
      '**' + char.name + ':** ' + char.name + ' glances up. "...mm. Where were we?"',
    ].join('\n');
  }

  static _canned(char, scene, shot) {
    const outfit = char.currentOutfitDesc || LabTurn.DEFAULT_OUTFIT;
    const newCharacter = { name: char.name, looks: char.appearance || '', personality: char.description || '' };
    const location = { name: scene.name || 'Scene', desc: scene.description || '', isNew: false };
    return {
      stage: JSON.stringify({
        newCharacters: [newCharacter],
        location,
        present: [{ name: char.name, present: true, emotion: '', outfit, outfitChanged: true }],
        shot,
      }),
      extract: JSON.stringify({ characters: [newCharacter], location }),
      wardrobe: JSON.stringify({ characters: [{ name: char.name, outfit, changed: true }] }),
      director: JSON.stringify(shot),
      default: '{}',
    };
  }
}

module.exports = LabTurn;
