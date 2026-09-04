// html.js — escape user-provided strings before they go into innerHTML.
// Anything a family typed (first name, apelido, display name, notes) must
// pass through here when rendered on another family's or a coach's screen.
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const esc = escapeHtml;
