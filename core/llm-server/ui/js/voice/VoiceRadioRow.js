export default class VoiceRadioRow {
  static create({ group, text, checked, title, onChange }) {
    const row = document.createElement('label');
    row.className = 'cm-voice-mic-row';
    if (title) row.title = title;
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = group;
    radio.checked = !!checked;
    radio.addEventListener('change', onChange);
    const span = document.createElement('span');
    span.textContent = text;
    row.appendChild(radio);
    row.appendChild(span);
    return { row, radio, span };
  }

  static tooltip(entry) {
    const about = entry.description || entry.name;
    return entry.license ? `${about}\nLicense: ${entry.license}` : about;
  }

  static downloadSuffix(sizeBytes) {
    return ' · ' + Math.round((sizeBytes || 0) / (1024 * 1024)) + ' MB download';
  }
}
