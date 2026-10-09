class OnboardingPersona {
  static PERSONAS = ['chat', 'create', 'build', 'tune', 'switch'];
  static DEFAULT = 'chat';
  static KEY = 'core.persona';

  static isKnown(persona) {
    return OnboardingPersona.PERSONAS.includes(persona);
  }

  static normalize(persona) {
    return OnboardingPersona.isKnown(persona) ? persona : OnboardingPersona.DEFAULT;
  }

  static get(db) {
    return OnboardingPersona.normalize(db.get(OnboardingPersona.KEY, OnboardingPersona.DEFAULT));
  }

  static set(db, persona) {
    const value = OnboardingPersona.normalize(persona);
    db.set(OnboardingPersona.KEY, value);
    return { success: true, persona: value };
  }
}

module.exports = OnboardingPersona;
