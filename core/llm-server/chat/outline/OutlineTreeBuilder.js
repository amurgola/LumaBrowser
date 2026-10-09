const OutlineNode = require('./OutlineNode');
const ProfileSummary = require('./ProfileSummary');

class OutlineTreeBuilder {
  static OPTIONAL_MARK = '?';

  static build(rootProfile) {
    return OutlineTreeBuilder._node(rootProfile, 0, null);
  }

  static _node(profile, depth, parentObjects) {
    const words = ProfileSummary.describe(profile);
    const optional = parentObjects !== null && profile.seen < parentObjects;
    const node = new OutlineNode({
      label: profile.path + (optional ? OutlineTreeBuilder.OPTIONAL_MARK : ''),
      path: profile.path,
      depth,
      text: words.text + (optional ? `, in ${profile.seen} of ${parentObjects}` : ''),
      detail: words.detail,
    });
    if (words.expands) OutlineTreeBuilder._attachChildren(node, profile);
    return node;
  }

  static _attachChildren(node, profile) {
    const objects = profile.countOf('object');
    for (const field of profile.fields.values()) node.children.push(OutlineTreeBuilder._node(field, node.depth + 1, objects));
    if (profile.element && profile.element.seen > 0) node.children.push(OutlineTreeBuilder._node(profile.element, node.depth + 1, null));
    node.unlisted = profile.unprofiledFieldCount;
  }
}

module.exports = OutlineTreeBuilder;
