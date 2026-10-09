const ArtifactManuals = require('./ArtifactManuals');
const MediaManuals = require('./MediaManuals');
const UtilityManuals = require('./UtilityManuals');

class StaticGroupTable {
  static GROUPS = Object.freeze([
    {
      key: 'artifacts',
      label: 'Artifacts',
      tools: ['create_artifact', 'edit_artifact'],
      stub: 'Render code, HTML, SVG, or markdown documents in the side panel for the user to read (create_artifact, edit_artifact).',
      doc: ArtifactManuals.ARTIFACT,
    },
    {
      key: 'live_artifacts',
      label: 'Live modules',
      tools: ['create_live_artifact', 'edit_artifact'],
      stub: 'Render an INTERACTIVE inline widget: calculator, todo app, game, live chart, toggle/slider, small simulation, or a live lookup fed by a website/JSON API. Call create_live_artifact with { title, html (a FRAGMENT, no <!DOCTYPE>/<html>/<body>), js }, NOT a single "content" string and NOT a full HTML document. Widgets can persist data across restarts via an injected async `store` and pull live web pages/APIs via an injected `luma` bridge (no CORS limits).',
      doc: ArtifactManuals.LIVE_ARTIFACT,
    },
    {
      key: 'artifact_data',
      label: 'Widget data',
      tools: ['get_artifact_data', 'update_artifact_data', 'schedule_artifact_updates'],
      stub: 'Read or write a live widget\'s saved data (the store its UI displays; the widget updates instantly), or schedule a recurring background update for it (get_artifact_data, update_artifact_data, schedule_artifact_updates).',
      doc: ArtifactManuals.ARTIFACT_DATA,
    },
    {
      key: 'images',
      label: 'Images',
      tools: ['generate_image', 'edit_image'],
      stub: 'Generate a bitmap image from a text prompt, or edit one you made earlier (generate_image, edit_image).',
      doc: MediaManuals.IMAGE,
    },
    {
      key: 'video',
      label: 'Video',
      tools: ['generate_video', 'animate_image'],
      stub: 'Generate a short video clip from a text prompt, or animate a still image you made earlier into a video (generate_video, animate_image).',
      doc: MediaManuals.VIDEO,
    },
    {
      key: 'music',
      label: 'Music',
      tools: ['generate_music'],
      stub: 'Compose a full song with vocals from lyrics and a style description (generate_music). Very slow: minutes per song.',
      doc: MediaManuals.MUSIC,
    },
    {
      key: 'web',
      label: 'Web',
      tools: ['web_search'],
      stub: 'Search the live web or read a page as Markdown without opening a tab: for current events, facts, docs, prices (web_search with { query } to search or { url } to read).',
      doc: UtilityManuals.WEB,
    },
    {
      key: 'knowledge_base',
      label: 'Knowledge base',
      tools: ['search_knowledge_base'],
      stub: 'Search the user\'s OWN uploaded documents (PDFs, notes, pages) for relevant passages; use when they ask about "my docs" or a file they added (search_knowledge_base).',
      doc: UtilityManuals.KNOWLEDGE_BASE,
    },
    {
      key: 'code_validation',
      label: 'Code validation',
      tools: ['validate_code'],
      stub: 'Statically lint/parse a code snippet for errors before you claim it works (validate_code).',
      doc: UtilityManuals.VALIDATE,
    },
    {
      key: 'programmatic',
      label: 'Programmatic',
      tools: ['send_webhook'],
      stub: 'Deliver data OUT to an automation endpoint the user gave you: POST/PUT/PATCH a JSON payload to a webhook URL (send_webhook).',
      doc: UtilityManuals.PROGRAMMATIC,
    },
  ].map((group) => Object.freeze({ ...group, tools: Object.freeze(group.tools) })));
}

module.exports = StaticGroupTable;
