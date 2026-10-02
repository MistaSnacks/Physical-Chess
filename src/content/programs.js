// programs.js — schools / sites where ACE teaches (SPEC §3, lms-programs).
// Placeholder list built from what the member roster suggests; the client
// confirms (SPEC §10 q3).
//
// Invite codes are NOT here (SPEC-v3 R15.12): this file ships to the
// browser. Real codes live only in the admin-read lms-programs collection
// and are checked by POST /api/players. Demo mode has its own placeholder
// table in src/lib/repo/localRepo.js.
export const PROGRAMS = [
  { key: 'bushwick', name: 'Achievement First Bushwick', dayOfWeek: 'Tue', active: true },
  { key: 'berkeley-carroll', name: 'Berkeley Carroll', dayOfWeek: 'Wed', active: true },
  { key: 'prospect', name: 'Prospect Schools', dayOfWeek: 'Thu', active: true },
  { key: 'brooklyn-open', name: 'ACE Brooklyn (open class)', dayOfWeek: 'Sat', active: true },
];

export function programByKey(key) {
  return PROGRAMS.find((p) => p.key === key) || null;
}
