const ValueKind = require('./ValueKind');
const ValueProfile = require('./ValueProfile');
const ElementSampler = require('./ElementSampler');
const JsonPath = require('./JsonPath');

class ProfileWalker {
  static ELEMENT_SAMPLE = 50;
  static MAX_DEPTH = 12;
  static VISIT_BUDGET = 5000;

  static profile(value) {
    const root = new ValueProfile(JsonPath.ROOT);
    ProfileWalker._visit(value, root, 0, { visitsLeft: ProfileWalker.VISIT_BUDGET });
    return root;
  }

  static _visit(raw, profile, depth, walk) {
    const value = ValueKind.normalize(raw);
    const kind = ValueKind.of(value);
    if (kind === 'absent') return;
    walk.visitsLeft--;
    profile.record(value, kind);
    if (depth >= ProfileWalker.MAX_DEPTH) return;
    if (kind === 'object') ProfileWalker._visitFields(value, profile, depth, walk);
    if (kind === 'array') ProfileWalker._visitElements(value, profile, depth, walk);
  }

  static _visitFields(obj, profile, depth, walk) {
    for (const key of Object.keys(obj)) {
      if (walk.visitsLeft <= 0) return;
      if (!ValueKind.isPresent(obj[key])) continue;
      const field = profile.field(key);
      if (field) ProfileWalker._visit(obj[key], field, depth + 1, walk);
    }
  }

  static _visitElements(items, profile, depth, walk) {
    if (items.length === 0) return;
    const element = profile.elementProfile();
    for (const i of ElementSampler.indices(items.length, ProfileWalker.ELEMENT_SAMPLE)) {
      if (walk.visitsLeft <= 0) return;
      ProfileWalker._visit(items[i], element, depth + 1, walk);
    }
  }
}

module.exports = ProfileWalker;
