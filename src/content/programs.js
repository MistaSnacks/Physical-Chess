// programs.js — schools / sites where ACE teaches (SPEC §3, lms-programs).
// Placeholder list built from what the member roster suggests; the client
// confirms (SPEC §10 q3). `inviteCode` is what a coach hands to families.
export const PROGRAMS = [
  { key: 'bushwick', name: 'Achievement First Bushwick', dayOfWeek: 'Tue', inviteCode: 'BUSHWICK', active: true },
  { key: 'berkeley-carroll', name: 'Berkeley Carroll', dayOfWeek: 'Wed', inviteCode: 'BERKELEY', active: true },
  { key: 'prospect', name: 'Prospect Schools', dayOfWeek: 'Thu', inviteCode: 'PROSPECT', active: true },
  { key: 'brooklyn-open', name: 'ACE Brooklyn (open class)', dayOfWeek: 'Sat', inviteCode: 'RODA', active: true },
];

export function programByKey(key) {
  return PROGRAMS.find((p) => p.key === key) || null;
}

export function programByInvite(code) {
  const c = String(code || '').trim().toUpperCase();
  return PROGRAMS.find((p) => p.inviteCode === c) || null;
}
