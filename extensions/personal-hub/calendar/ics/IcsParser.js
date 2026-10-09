class IcsParser {
  static DATE_PROPS = new Set(['DTSTART', 'DTEND', 'RECURRENCE-ID', 'LAST-MODIFIED']);

  static parse(text) {
    const lines = IcsParser.unfold(String(text || ''));
    const result = { events: [], timezones: [] };
    let current = null;
    let depth = 0;
    for (const line of lines) {
      const prop = IcsParser.parseLine(line);
      if (!prop) continue;
      if (prop.name === 'BEGIN') {
        depth += 1;
        if (prop.value === 'VEVENT') current = IcsParser._newEvent();
        continue;
      }
      if (prop.name === 'END') {
        depth -= 1;
        if (prop.value === 'VEVENT' && current) {
          if (current.uid && current.dtstart) result.events.push(current);
          current = null;
        }
        continue;
      }
      if (prop.name === 'TZID' && !current) {
        result.timezones.push(prop.value);
        continue;
      }
      if (current) IcsParser._apply(current, prop);
    }
    return result;
  }

  static unfold(text) {
    const raw = text.split(/\r\n|\n|\r/);
    const out = [];
    for (const line of raw) {
      if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) out[out.length - 1] += line.slice(1);
      else out.push(line);
    }
    return out.filter((line) => line.length > 0);
  }

  static parseLine(line) {
    let i = 0;
    let inQuotes = false;
    while (i < line.length) {
      const ch = line[i];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ':' && !inQuotes) break;
      i += 1;
    }
    if (i >= line.length) return null;
    const head = line.slice(0, i);
    const value = line.slice(i + 1);
    const parts = IcsParser._splitUnquoted(head, ';');
    const name = parts[0].toUpperCase();
    if (!name) return null;
    const params = {};
    for (const part of parts.slice(1)) {
      const eq = part.indexOf('=');
      if (eq < 0) continue;
      params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).replace(/^"|"$/g, '');
    }
    return { name, params, value };
  }

  static unescapeText(value) {
    return String(value == null ? '' : value).replace(/\\([\\;,nN])/g, (_m, ch) => (ch === 'n' || ch === 'N' ? '\n' : ch));
  }

  static dateValue(prop) {
    const value = String(prop.value || '').trim();
    const isDate = (prop.params.VALUE || '').toUpperCase() === 'DATE' || /^\d{8}$/.test(value);
    return { value, tzid: prop.params.TZID || null, isDate };
  }

  static _newEvent() {
    return {
      uid: '', summary: '', description: '', location: '', dtstart: null, dtend: null, duration: null, rrule: null,
      exdates: [], recurrenceId: null, status: '', url: '', organizer: null, attendees: [], lastModified: null, sequence: 0,
    };
  }

  static _apply(event, prop) {
    switch (prop.name) {
      case 'UID': event.uid = prop.value.trim(); break;
      case 'SUMMARY': event.summary = IcsParser.unescapeText(prop.value); break;
      case 'DESCRIPTION': event.description = IcsParser.unescapeText(prop.value); break;
      case 'LOCATION': event.location = IcsParser.unescapeText(prop.value); break;
      case 'DTSTART': event.dtstart = IcsParser.dateValue(prop); break;
      case 'DTEND': event.dtend = IcsParser.dateValue(prop); break;
      case 'DURATION': event.duration = prop.value.trim(); break;
      case 'RRULE': event.rrule = prop.value.trim(); break;
      case 'EXDATE': IcsParser._applyExdate(event, prop); break;
      case 'RECURRENCE-ID': event.recurrenceId = IcsParser.dateValue(prop); break;
      case 'STATUS': event.status = prop.value.trim().toUpperCase(); break;
      case 'URL': event.url = prop.value.trim(); break;
      case 'ORGANIZER': event.organizer = IcsParser._person(prop); break;
      case 'ATTENDEE': event.attendees.push(IcsParser._person(prop)); break;
      case 'LAST-MODIFIED': event.lastModified = IcsParser.dateValue(prop); break;
      case 'SEQUENCE': event.sequence = parseInt(prop.value, 10) || 0; break;
      default: break;
    }
  }

  static _applyExdate(event, prop) {
    for (const value of prop.value.split(',')) {
      const v = value.trim();
      if (v) event.exdates.push(IcsParser.dateValue({ value: v, params: prop.params }));
    }
  }

  static _person(prop) {
    const email = prop.value.replace(/^mailto:/i, '').trim();
    return {
      name: prop.params.CN ? IcsParser.unescapeText(prop.params.CN) : '',
      email: email.includes('@') ? email : '',
      partstat: prop.params.PARTSTAT || '',
    };
  }

  static _splitUnquoted(text, separator) {
    const parts = [];
    let buf = '';
    let inQuotes = false;
    for (const ch of text) {
      if (ch === '"') inQuotes = !inQuotes;
      if (ch === separator && !inQuotes) {
        parts.push(buf);
        buf = '';
      } else {
        buf += ch;
      }
    }
    parts.push(buf);
    return parts;
  }
}

module.exports = IcsParser;
