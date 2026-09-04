// export.js — client-side CSV / JSON of one player's ledger (SPEC §3.4, §5.3).
// Guardian report card downloads a Blob; nothing hits the server in demo.

const CSV_COLUMNS = ['occurredAt', 'type', 'moduleId', 'lessonId', 'xp', 'stars', 'source', 'payload'];

function csvEscape(value) {
  if (value == null) return '';
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV of ledger events. Columns: occurredAt, type, moduleId, lessonId, xp, stars, source, payload. */
export function eventsToCsv(events = []) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const e of events) {
    lines.push([
      csvEscape(e.occurredAt),
      csvEscape(e.type),
      csvEscape(e.moduleId),
      csvEscape(e.lessonId),
      csvEscape(e.xp ?? 0),
      csvEscape(e.stars ?? 0),
      csvEscape(e.source || 'app'),
      csvEscape(e.payload && Object.keys(e.payload).length ? JSON.stringify(e.payload) : ''),
    ].join(','));
  }
  return lines.join('\n');
}

/**
 * Everything the app holds about one child, for the guardian JSON download.
 * Never includes other players or other families.
 */
export function playerExportPayload({ player, snapshot, events, account }) {
  return {
    exportedAt: new Date().toISOString(),
    player: {
      id: player?.id,
      firstName: player?.firstName,
      apelido: player?.apelido,
      avatar: player?.avatar,
      birthYear: player?.birthYear ?? null,
      program: player?.program ?? null,
      startedAt: player?.startedAt ?? null,
      mayPlayInClass: player?.mayPlayInClass !== false,
    },
    guardian: {
      displayName: account?.displayName || '',
      // Guardian email only — never another family's, never a child's.
      email: account?.email || '',
    },
    snapshot: snapshot || null,
    events: events || [],
  };
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename, events) {
  downloadText(filename, eventsToCsv(events), 'text/csv;charset=utf-8');
}

export function downloadJson(filename, payload) {
  downloadText(filename, JSON.stringify(payload, null, 2), 'application/json');
}

export { CSV_COLUMNS };
