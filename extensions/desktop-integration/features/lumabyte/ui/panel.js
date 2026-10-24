import MarkdownRenderer from '../../../../../core/llm-server/ui/js/markdown/MarkdownRenderer.js';

const ICON_SEND = '<svg viewBox="0 0 16 16"><path d="M8 12.5v-9M4 7.5l4-4 4 4"/></svg>';
const ICON_STOP = '<svg viewBox="0 0 16 16"><rect x="4.5" y="4.5" width="7" height="7" rx="1.5" class="fill"/></svg>';
const STARTS = ['What am I looking at?', 'Summarize what is on screen', 'What should I do next here?'];

const $ = (id) => document.getElementById(id);
const els = { sheet: $('sheet'), where: $('where'), log: $('log'), status: $('status'), statusText: $('statusText'), composer: $('composer'), input: $('input'), send: $('send'), sees: $('sees') };
const state = { busy: false, live: null, liveText: '', app: '', caps: null, previous: null };

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function atBottom() {
  const l = els.log;
  return l.scrollHeight - l.scrollTop - l.clientHeight < 40;
}

function scrollDown(force) {
  if (force || atBottom()) els.log.scrollTop = els.log.scrollHeight;
}

function addMessage(role, content, { meta = '', error = false } = {}) {
  const empty = els.log.querySelector('.empty');
  if (empty) empty.remove();
  $('newBtn').hidden = false;
  const div = document.createElement('div');
  div.className = `msg ${role === 'user' ? 'user' : 'bot'}${error ? ' err' : ''}`;
  if (role === 'user') div.textContent = content;
  else div.innerHTML = MarkdownRenderer.render(content) + (meta ? `<div class="meta">${esc(meta)}</div>` : '');
  els.log.appendChild(div);
  scrollDown(true);
  return div;
}

function ago(at) {
  const min = Math.round((Date.now() - at) / 60000);
  if (!at || min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

function renderEmpty() {
  $('newBtn').hidden = true;
  const p = state.previous;
  const resume = p ? `<button class="resume" id="resumeBtn" type="button">Continue the last conversation<span>${p.count} message${p.count === 1 ? '' : 's'}, ${esc(ago(p.updated))}</span></button>` : '';
  els.log.innerHTML = `<div class="empty"><div class="empty-title">Ask about ${esc(state.app || 'this window')}</div>`
    + '<div class="empty-sub">Each message takes a fresh look at the window. Nothing is captured in between.</div>'
    + `<div class="starts">${STARTS.map((s, i) => `<button class="start" type="button" style="--i:${i}">${esc(s)}</button>`).join('')}</div>${resume}</div>`;
  els.log.querySelectorAll('.start').forEach((b) => b.addEventListener('click', () => send(b.textContent)));
  const rb = $('resumeBtn');
  if (rb) rb.addEventListener('click', resumeLast);
}

function renderThread(messages) {
  els.log.innerHTML = '';
  if (!messages.length) renderEmpty();
  else for (const m of messages) addMessage(m.role, m.content);
}

async function resumeLast() {
  if (state.busy) return;
  const r = await window.lumabyte.call('resume');
  if (!r || !r.success) return;
  state.previous = r.previous;
  renderThread(r.messages);
  els.input.focus();
}

function setBusy(busy) {
  state.busy = busy;
  els.sheet.classList.toggle('busy', busy);
  els.send.classList.toggle('stop', busy);
  els.send.innerHTML = busy ? ICON_STOP : ICON_SEND;
  els.send.title = busy ? 'Stop' : 'Send (Enter)';
  els.send.setAttribute('aria-label', busy ? 'Stop' : 'Send');
  refreshSend();
}

function refreshSend() {
  els.send.disabled = !state.busy && (!els.input.value.trim() || !(state.caps && state.caps.ready));
}

function setStatus(text) {
  els.status.hidden = !text;
  els.statusText.textContent = text || '';
}

function canDo(caps) {
  const can = [caps.canAct ? 'act in it' : null, caps.canRead ? 'read files' : null].filter(Boolean);
  return can.length ? `, can ${can.join(' and ')}` : '';
}

function paintSees(caps) {
  state.caps = caps;
  els.sees.classList.toggle('warn', !caps.ready || !caps.vision);
  if (!caps.ready) els.sees.textContent = caps.reason || 'Not ready';
  else if (!caps.vision) els.sees.textContent = 'Reads the window text only: this model cannot see images';
  else els.sees.textContent = `Sees the window when you send${canDo(caps)}`;
  const notes = [els.sees.textContent];
  if (caps.ready && caps.vision && caps.visionLoads) notes.push('The first look loads the model\'s vision, so it takes longer.');
  if (caps.ready && !caps.canAct && caps.actReason) notes.push(`Cannot act in the window: ${caps.actReason}`);
  els.sees.title = notes.join('\n');
  refreshSend();
}

function seenMeta(seen) {
  if (!seen) return '';
  const what = [seen.screenshot ? 'the window' : null, seen.text ? 'its text' : null].filter(Boolean);
  return what.length ? `Looked at ${what.join(' and ')}` : 'Could not look at the window';
}

async function send(text) {
  const prompt = String(text || '').trim();
  if (!prompt || state.busy) return;
  els.input.value = '';
  autosize();
  addMessage('user', prompt);
  setBusy(true);
  setStatus('Looking at the window');
  const r = await window.lumabyte.call('send', { text: prompt });
  if (!r || !r.success) {
    setBusy(false);
    setStatus('');
    addMessage('bot', (r && r.error) || 'Could not send', { error: true });
  }
}

function onEvent(e) {
  if (!e) return;
  if (e.type === 'side') { document.body.dataset.side = e.side; return; }
  if (e.type === 'status') {
    setStatus(e.text === 'Thinking' ? 'Thinking' : e.text);
    if (e.seen) state.seen = e.seen;
    return;
  }
  if (e.type === 'reasoning') { setStatus('Thinking'); return; }
  if (e.type === 'step') { paintStep(e); return; }
  if (e.type === 'delta') {
    setStatus('');
    if (!state.live) { state.live = addMessage('bot', ''); state.liveText = ''; }
    state.liveText += e.text;
    state.live.innerHTML = MarkdownRenderer.render(state.liveText, { streaming: true });
    scrollDown(false);
    return;
  }
  if (e.type === 'done' || e.type === 'error') {
    const meta = seenMeta(state.seen);
    if (e.type === 'error') {
      if (state.live) state.live.remove();
      addMessage('bot', e.error || 'Something went wrong', { error: true });
    } else if (state.live) {
      state.live.innerHTML = MarkdownRenderer.render(e.text || state.liveText) + (meta ? `<div class="meta">${esc(meta)}${e.aborted ? ', stopped' : ''}</div>` : '');
    } else if (e.text) {
      addMessage('bot', e.text, { meta });
    }
    state.live = null;
    state.liveText = '';
    state.seen = null;
    state.steps = null;
    setStatus('');
    setBusy(false);
    scrollDown(false);
  }
}

function paintStep(e) {
  if (!state.steps) {
    state.steps = document.createElement('div');
    state.steps.className = 'steps';
    els.log.appendChild(state.steps);
  }
  let line = state.steps.querySelector(`[data-i="${e.index}"]`);
  if (!line) {
    line = document.createElement('div');
    line.dataset.i = String(e.index);
    state.steps.appendChild(line);
  }
  line.className = `step ${e.state}`;
  line.textContent = e.state === 'fail' && e.error ? `${e.text}: ${e.error}` : e.text;
  scrollDown(false);
}

function autosize() {
  els.input.style.height = 'auto';
  els.input.style.height = `${Math.min(els.input.scrollHeight, 140)}px`;
  refreshSend();
}

async function load() {
  const s = await window.lumabyte.call('state');
  if (!s || !s.success) return;
  state.app = s.app;
  const named = s.title && s.title.toLowerCase().includes(String(s.app).toLowerCase());
  els.where.textContent = !s.title ? s.app : named ? s.title : `${s.app}: ${s.title}`;
  els.where.title = els.where.textContent;
  els.input.placeholder = `Ask about ${s.app}`;
  paintSees(s.caps);
  state.previous = s.previous || null;
  renderThread(s.messages);
  setBusy(!!s.busy);
  requestAnimationFrame(() => els.sheet.classList.add('in'));
  els.input.focus();
}

els.composer.addEventListener('submit', (e) => {
  e.preventDefault();
  if (state.busy) window.lumabyte.call('stop');
  else send(els.input.value);
});
els.input.addEventListener('input', autosize);
els.input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    if (!state.busy) send(els.input.value);
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.lumabyte.call('close'); });
$('closeBtn').addEventListener('click', () => window.lumabyte.call('close'));
$('detachBtn').addEventListener('click', () => window.lumabyte.call('detach'));
$('lumaBtn').addEventListener('click', () => window.lumabyte.call('openInLuma'));
$('newBtn').addEventListener('click', async () => {
  if (state.busy) return;
  const r = await window.lumabyte.call('clear');
  if (r && r.success) state.previous = r.previous || null;
  renderEmpty();
  els.input.focus();
});
window.addEventListener('focus', async () => {
  const s = await window.lumabyte.call('state');
  if (s && s.success) paintSees(s.caps);
  els.input.focus();
});
window.lumabyte.onEvent(onEvent);
load();
