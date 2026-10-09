const ScheduleBounds = require('../tool-groups/ScheduleBounds');

const OPTIONAL_TITLE = { type: 'string', description: 'Optional short title' };
const VIDEO_DURATION = {
  type: 'number',
  description: 'Clip length in seconds, max 15. Omit for the model default; longer clips render proportionally slower. Actual length may snap slightly to the model\'s frame grid.',
};
const LIVE_ARTIFACT_ID = { type: 'string', description: 'The live artifact id (art_…, any version)' };

class PseudoToolSchemaTable {
  static ENTRIES = Object.freeze([
    {
      name: 'create_artifact',
      description: 'Render a self-contained artifact in the chat side panel. '
        + 'Use this whenever the user asks for a document, README, article, page, image or program '
        + 'to look at, rather than pasting it into the reply. ALWAYS pass `type` and `content`.',
      properties: {
        title: { type: 'string', description: 'Short title shown as the artifact name in the panel' },
        type: {
          type: 'string',
          enum: ['code', 'html', 'svg', 'markdown'],
          description: 'REQUIRED. Which renderer to use, chosen from what the user asked for: '
            + '"markdown" for prose documents, READMEs, articles and notes; '
            + '"code" for source code to read (set `language` too); '
            + '"html" for a complete standalone web page; '
            + '"svg" for vector graphics. Omitting this renders the artifact wrong.',
        },
        language: { type: 'string', description: 'Language id when type=code (e.g. python, csharp)' },
        content: { type: 'string', description: 'The COMPLETE content as one string, ready to render' },
      },
      required: ['type', 'content'],
    },
    {
      name: 'edit_artifact',
      description: 'Revise an artifact created earlier this conversation. Prefer targeted replacements over a full rewrite.',
      properties: {
        artifactId: { type: 'string', description: 'Id of the artifact to edit (art_…)' },
        replacements: { type: 'array', items: { type: 'object' }, description: 'Array of {find, replace, replaceAll?} for targeted edits' },
        content: { type: 'string', description: 'Full revised document (only for a >50% rewrite); text artifacts ONLY, never a live module' },
        html: { type: 'string', description: 'LIVE MODULE ONLY: the new markup; omit to keep the current markup' },
        js: { type: 'string', description: 'LIVE MODULE ONLY: the COMPLETE new module script; omit to keep the current script' },
        libs: { type: 'array', items: { type: 'string' }, description: 'LIVE MODULE ONLY: extra libraries, e.g. ["chartjs"]; omit to keep the current libs' },
        title: { type: 'string', description: 'Optional new title (falls back to the source title)' },
      },
      required: ['artifactId'],
    },
    {
      name: 'create_live_artifact',
      description: 'Render an INTERACTIVE module inline in the chat, reactive via ResonantJS (R), optionally Chart.js. Use for live widgets: calculators, charts, toggles, simulations, live web/API lookups.',
      properties: {
        title: { type: 'string', description: 'Short title' },
        html: { type: 'string', description: 'HTML markup for the module (use res-* attributes for ResonantJS bindings). Goes inside the module container "root".' },
        js: { type: 'string', description: 'JS body executed with (root, R, Chart, store, luma). root=container element, R=a scoped Resonant instance (R.add(name,val), R.format(...)), Chart=Chart.js when requested in libs, store=persistent async key-value data, luma=host browser bridge (await luma.fetchPage(url,{mode}) → page/API content, no CORS limits; await luma.openTab(url); luma.ext(id).call(method,...args) for extension data such as the Hub\'s tasks, calendar and conversation queue, id "personal-hub").' },
        libs: { type: 'array', items: { type: 'string' }, description: 'Optional extra libraries to load, e.g. ["chartjs"].' },
      },
      required: ['html'],
    },
    {
      name: 'generate_image',
      description: 'Generate an image from a text prompt; opens in the side panel.',
      properties: {
        prompt: { type: 'string', description: 'What to draw' },
        title: OPTIONAL_TITLE,
      },
      required: ['prompt'],
    },
    {
      name: 'edit_image',
      description: 'Edit an image artifact, optionally drawing on reference images. Word the prompt the way the EDIT MODEL guide says. frame reshapes the canvas only when the composition changes.',
      properties: {
        artifactId: { type: 'string', description: 'Id of the source image artifact. Each edit is saved as a new version and the source is kept. When the user rejects the last edit, pass the id of the version BEFORE it (the catalog lists earlier version ids), not the latest.' },
        prompt: { type: 'string', description: 'The edit to apply, worded as the EDIT MODEL guide says: an instruction for an edit model, the full final image for img2img' },
        strength: { type: 'number', description: 'img2img only, an edit model ignores it: 0.35-0.5 small recolor, 0.8-0.9 add a feature' },
        frame: {
          type: 'string',
          enum: ['match', 'square', 'portrait', 'landscape', 'tall', 'wide'],
          description: 'Output framing. Omit / "match" keeps the source shape (retouches). Set only when the request CHANGES the composition: "tall" = full-body standing figure from a head-shot, "wide" = widen the scene, "portrait"/"landscape"/"square" for those shapes. Pixel sizes are chosen per model.',
        },
        references: {
          type: 'array',
          description: 'Optional, at most 3 unless the EDIT MODEL guide gives another number: OTHER image artifacts to draw from (a face, an outfit, a scene). The source is the first image and references follow in order; name them in the prompt the way the EDIT MODEL guide shows. Needs an edit-capable model.',
          items: {
            type: 'object',
            properties: {
              artifactId: { type: 'string', description: 'Id of the reference image artifact' },
              use: { type: 'string', description: 'What to take from it, a few words: "face", "outfit", "scene"' },
            },
            required: ['artifactId'],
          },
        },
        title: OPTIONAL_TITLE,
      },
      required: ['artifactId', 'prompt'],
    },
    {
      name: 'generate_video',
      description: 'Generate a short video clip from a text prompt; opens in the side panel. Slow/heavy.',
      properties: {
        prompt: { type: 'string', description: 'The full video prompt: subject, action/motion, camera, plus any music/sound (audio-capable models render it, silent ones ignore it)' },
        durationSec: VIDEO_DURATION,
        title: OPTIONAL_TITLE,
      },
      required: ['prompt'],
    },
    {
      name: 'animate_image',
      description: 'Animate a still image artifact made earlier into a short video (image-to-video). The image becomes the first frame.',
      properties: {
        artifactId: { type: 'string', description: 'Id of the source image artifact to use as the first frame' },
        prompt: { type: 'string', description: 'Describe the motion to add (camera move, subject motion, …)' },
        durationSec: VIDEO_DURATION,
        endArtifactId: { type: 'string', description: 'Optional id of an image artifact to pin as the LAST frame' },
        title: OPTIONAL_TITLE,
      },
      required: ['artifactId', 'prompt'],
    },
    {
      name: 'generate_music',
      description: 'Compose a full song (vocals + instruments) from lyrics and a style description; opens in the side panel. Very slow: a song takes minutes to render.',
      properties: {
        lyrics: { type: 'string', description: 'The complete song lyrics. Structure tags like [Verse], [Chorus], [Bridge] on their own lines guide the arrangement.' },
        style_description: { type: 'string', description: 'The musical style: genre, mood, tempo/BPM, key instruments, vocal style (e.g. "Warm acoustic pop, female vocals, 95 BPM, gentle guitar and strings").' },
        durationSec: { type: 'number', description: 'Target song length in seconds, max 300 (5 min). Omit for the natural length of the lyrics.' },
        seed: { type: 'number', description: 'Optional seed for reproducible output' },
        title: OPTIONAL_TITLE,
      },
      required: ['lyrics', 'style_description'],
    },
    {
      name: 'web_search',
      description: 'Look things up on the live web without opening a tab. "query" returns numbered results; "url" reads a page as Markdown, one part at a time.',
      properties: {
        query: { type: 'string', description: 'What to search the web for' },
        url: { type: 'string', description: 'Page to read: a result NUMBER from your latest search (e.g. "2"; best, no retyping) or a full http(s) address' },
        find: { type: 'string', description: 'With "url": show only excerpts around case-insensitive matches of this term, each tagged with its part (for one fact on a long page)' },
        part: { type: 'number', description: 'With "url": which part of a long page to read (1 = start; each reply says how many parts there are)' },
      },
      required: [],
    },
    {
      name: 'search_knowledge_base',
      description: 'Look things up in the documents the user added (their knowledge base). Returns the most relevant passages, each tagged [S1], [S2], ... with its file and page; put the tag after any fact you take from it.',
      properties: {
        query: { type: 'string', description: 'What to look for in the uploaded documents' },
      },
      required: ['query'],
    },
    {
      name: 'validate_code',
      description: 'Statically check a code snippet for errors.',
      properties: {
        code: { type: 'string', description: 'The source to check' },
        language: { type: 'string', description: 'Language id' },
      },
      required: ['code'],
    },
    {
      name: 'get_artifact_data',
      description: 'Read a live widget\'s saved data (the same object its injected store reads).',
      properties: {
        artifactId: LIVE_ARTIFACT_ID,
      },
      required: ['artifactId'],
    },
    {
      name: 'update_artifact_data',
      description: 'Write a live widget\'s saved data; its UI updates instantly. Per-key: pass only the keys to change.',
      properties: {
        artifactId: LIVE_ARTIFACT_ID,
        set: { type: 'object', description: 'Keys to set, e.g. {"price": 43210.5}' },
        remove: { type: 'array', items: { type: 'string' }, description: 'Key names to delete' },
      },
      required: ['artifactId'],
    },
    {
      name: 'send_webhook',
      description: 'Deliver data to an automation endpoint the user gave you: POST/PUT/PATCH a JSON payload to an http(s) webhook URL. Returns the HTTP status and the start of the response body.',
      properties: {
        url: { type: 'string', description: 'The endpoint to call: ONLY a URL the user provided' },
        payload: { type: 'object', description: 'The data to deliver, as a JSON object (a string is sent as raw text)' },
        method: { type: 'string', enum: ['POST', 'PUT', 'PATCH'], description: 'HTTP method (default POST)' },
        headers: { type: 'object', description: 'Optional extra headers, e.g. an API key header' },
      },
      required: ['url'],
    },
    {
      name: 'schedule_artifact_updates',
      description: 'Set up a recurring background run that refreshes a live widget\'s data (e.g. re-check a price every 30 minutes).',
      properties: {
        artifactId: { type: 'string', description: 'The live artifact to keep updated' },
        prompt: { type: 'string', description: 'The instruction each run executes (what to fetch, which keys to update)' },
        everyMinutes: { type: 'number', description: `Interval in minutes (${ScheduleBounds.rangeText()})` },
        title: { type: 'string', description: 'Optional short task name' },
      },
      required: ['artifactId', 'prompt', 'everyMinutes'],
    },
  ]);

  static ACTIVATE_TOOLS = Object.freeze({
    name: 'activate_tools',
    description: 'Load the detailed instructions for one or more lazy tool groups (e.g. images, artifacts) listed as inactive in the prompt. Returns their full usage docs and keeps them loaded for the rest of the conversation.',
    properties: {
      groups: { type: 'array', items: { type: 'string' }, description: 'Group keys to activate, e.g. ["images"].' },
    },
    required: ['groups'],
  });
}

module.exports = PseudoToolSchemaTable;
