class PoseCatalog {
  static SITTING = { key: 'sitting', variant: 'sitting on a simple wooden stool, knees together, hands resting in their lap, facing the viewer', figH: 0.74 };
  static KNEELING = { key: 'kneeling', variant: 'kneeling on the floor, facing the viewer', figH: 0.78 };
  static LYING = { key: 'lying', variant: 'lying down relaxed, full body visible', figH: 0.6 };
  static JUMPING = { key: 'jumping', variant: 'jumping joyfully into the air, arms raised, full body', figH: 0.86 };
  static STANDING = { key: 'standing', variant: null, figH: 0.92 };
  static AWAY_PROSE = { key: 'away', variant: 'seen from BEHIND in a full rear view, their back fully turned to the camera, facing away, glancing shyly back over their shoulder', figH: 0.9 };
  static AWAY_DIRECTED = { key: 'away', variant: 'seen from BEHIND in a full rear view, their back fully turned to the camera, facing away, glancing back over their shoulder', figH: 0.9 };
  static AWAY_FACING = { key: 'away', variant: 'seen from BEHIND in a full rear view, their back fully turned to the camera, facing away', figH: 0.9 };

  static PROSE_RULES = [
    [/\b(sit|sits|sitting|seated|sat|cross-?legged|legs? crossed|perch|perched|lounge|lounging|recline|reclining)\b/, 'SITTING'],
    [/\b(kneel|kneels|kneeling|knelt|crouch|crouches|crouching)\b/, 'KNEELING'],
    [/\b(lying|lie|lies|laid|lay down|lying down|reclined flat|sprawl)\b/, 'LYING'],
    [/(turn(?:s|ed)? away|over (?:her|his|their) shoulder|glanc\w* back|back to (?:the )?(?:viewer|camera)|looking away|faces? away|avert)/, 'AWAY_PROSE'],
    [/\b(jump|jumps|jumping|leap|leaps|leapt|spring|springs|mid-air)\b/, 'JUMPING'],
  ];
  static DIRECTOR_POSES = { sitting: 'SITTING', kneeling: 'KNEELING', lying: 'LYING', jumping: 'JUMPING', away: 'AWAY_DIRECTED' };

  static BODY_CUES = {
    surprised: 'both hands raised up near their face in surprise, startled body language',
    embarrassed: 'one hand raised to their cheek, the other arm held close, bashful body language',
    angry: 'leaning forward with clenched fists, tense aggressive body language',
    sad: 'shoulders slumped, one hand to their chest, dejected body language',
    happy: 'a relaxed, open and lively posture, one hand gesturing',
  };

  static resolve(shot, content) {
    return PoseCatalog.fromDirector(shot) || PoseCatalog.fromProse(content);
  }

  static fromProse(content) {
    const t = String(content || '').toLowerCase();
    const rule = PoseCatalog.PROSE_RULES.find(([re]) => re.test(t));
    return PoseCatalog._copy(rule ? rule[1] : 'STANDING');
  }

  static fromDirector(shot) {
    if (!shot || !shot.pose) return null;
    const name = PoseCatalog.DIRECTOR_POSES[shot.pose];
    if (name) return PoseCatalog._copy(name);
    return PoseCatalog._copy(shot.facing === 'away' ? 'AWAY_FACING' : 'STANDING');
  }

  static bodyCue(emotion) {
    return PoseCatalog.BODY_CUES[emotion] || null;
  }

  static _copy(name) {
    return Object.assign({}, PoseCatalog[name]);
  }
}

module.exports = PoseCatalog;
