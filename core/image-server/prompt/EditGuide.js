const EditProfiles = require('./EditProfiles');

class EditGuide {
  static build({ mode, label = '', family = null } = {}) {
    const name = label ? ` "${label}"` : '';
    if (mode === 'img2img') return EditGuide._img2imgGuide(name);
    return EditGuide._referenceGuide(name, EditProfiles.editProfileFor(family) || EditProfiles.GENERIC_PROFILE);
  }

  static _img2imgGuide(name) {
    return [
      `EDIT MODE: no edit model is configured, so edit_image re-draws the source with the generation model${name} (img2img).`,
      '  - The prompt describes the desired FINAL image in full: every element the user wants to keep, plus what',
      '    changed. Not a diff, not a one-liner. If the original was "cat in a funky hat" and the user asks for a',
      '    mustache, write "A cat wearing a funky colorful hat AND a big bushy mustache, ...".',
      '  - `strength` decides how much is re-drawn, so set it from the buckets above.',
      '  - `references` and a `frame` other than match are ignored in this mode.',
      '  - With a marked region (`regionId`) only the painted area is re-drawn as an inpaint: still describe the',
      '    FINAL image, with the change the user asked for in that spot, and prefer strength 0.8 or higher. A small',
      '    area is worked on as an enlarged close-up around it, so describe what is in or right next to the area.',
    ].join('\n');
  }

  static _referenceGuide(name, profile) {
    const t = EditProfiles.tagFor(profile.refTag);
    return [
      `EDIT MODEL: edit_image runs on${name || ' a reference-image edit model'}. It looks at the source and at every reference, so write the prompt as an INSTRUCTION to an editor:`,
      '  - Open with the operation ("Replace ...", "Dress ...", "Change ...", "Add ...", "Remove ..."), not with a',
      '    description of the finished picture.',
      '  - State what changes, plainly and completely, then add ONE keep sentence for everything else, such as',
      `    "Keep the pose, body proportions, framing, background and lighting of ${t(1)} unchanged."`,
      '  - Do not describe what should stay the same. Whatever you describe is redrawn, and a redrawn face or',
      '    product drifts away from the original.',
      '  - A face, person, garment or object that comes from an image is POINTED AT, never described:',
      `    "the face of the woman in ${t(2)}", "the jacket from ${t(3)}".`,
      `  - With references, call the images ${t(1)} (the source artifactId), ${t(2)}, ${t(3)} in the order listed, and`,
      '    mention every one of them. With no references, say "the image".',
      '  - The source is the canvas: choose the image whose pose, framing and background the result keeps. For a',
      '    face swap or an outfit change the source is the photo of the PERSON; the face or the garment is a',
      '    reference.',
      `  - When a face or head is replaced, ask for the head to keep the size and angle it has in ${t(1)}.`,
      `  - \`strength\` is ignored by this model. It takes at most ${profile.maxReferences} references.`,
      '  - Text in the picture: quote both strings and keep the lettering style, as in',
      '    "Replace the text \'OPEN\' with \'CLOSED\', keeping the same font, size and colour."',
      '  - After the render, parts the model did not visibly change are restored from the source, so a slight',
      '    colour drift never creeps in. A DELIBERATE change to the whole picture that is subtle (a warmer tone,',
      '    a slight colour grade, a soft-focus look) would be undone by that: pass `keepUnchanged: false` for it.',
      '    A restyle or a change of scene is detected as whole-picture on its own.',
      '  - With a marked region (`regionId`) write the instruction for what changes INSIDE that area only; where it',
      '    sits is added for you, and the picture outside it is restored from the source afterwards. A small area is',
      '    edited on an enlarged close-up around it, so the model sees only what is in or right next to the area:',
      '    refer to that, not to things elsewhere in the picture.',
      '  - A frame other than match EXTENDS the picture: the source is kept whole inside the new shape and only the',
      '    new space is painted in. Say what the new space should show ("continue the room", "show the legs and',
      '    feet standing on the same floor"). `anchor` places the source in the new frame: center (default), top',
      '    (a head-shot made full-body: the head stays at the top, the body is added below), bottom, left, right.',
    ].join('\n');
  }
}

module.exports = EditGuide;
