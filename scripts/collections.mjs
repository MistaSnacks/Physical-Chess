// collections.mjs — the lms-* collection definitions (SPEC §3, SPEC-v3 §4).
// Shared by scripts/wix-collections.mjs and by the one-off MCP creation run.
// Permissions: insert / read / update / remove.
//
// SPEC-v3 WP15 (trusted access): nothing a member writes can grant a role,
// a program, XP from a coach, a corda, a stamp or a coach patch.
//   - lms-accounts, lms-players: admin-write, author-only read. Written only
//     by /api/account and /api/players, which set _owner to the member.
//   - lms-events: members still append their own learner events; coach-only
//     types found there are ignored (src/lib/repo/ledger.js).
//   - lms-patch-awards, lms-corda-awards, lms-attendance, lms-coach-events:
//     admin-write, author read; the server sets _owner to the guardian.
//   - lms-programs: admin read, because it holds the real invite codes.
// Do not run wix:collections until the OAuth app exists (D13) and the
// _owner spike in agents/reports/WP15.md has passed.
const P = {
  memberOwn: { insert: 'SITE_MEMBER', read: 'SITE_MEMBER_AUTHOR', update: 'SITE_MEMBER_AUTHOR', remove: 'ADMIN' },
  memberAppend: { insert: 'SITE_MEMBER', read: 'SITE_MEMBER_AUTHOR', update: 'ADMIN', remove: 'ADMIN' },
  adminWriteMemberRead: { insert: 'ADMIN', read: 'SITE_MEMBER_AUTHOR', update: 'ADMIN', remove: 'ADMIN' },
  catalog: { insert: 'ADMIN', read: 'ANYONE', update: 'ADMIN', remove: 'ADMIN' },
  serverOnly: { insert: 'ADMIN', read: 'SITE_MEMBER', update: 'ADMIN', remove: 'ADMIN' },
  adminOnly: { insert: 'ADMIN', read: 'ADMIN', update: 'ADMIN', remove: 'ADMIN' },
};
const f = (key, type, displayName) => ({ key, type, displayName: displayName || key });

export const COLLECTIONS = [
  { id: 'lms-accounts', displayName: 'LMS Accounts', permissions: P.adminWriteMemberRead, fields: [f('memberId','TEXT','Member ID'), f('role','TEXT'), f('displayName','TEXT'), f('email','TEXT'), f('phone','TEXT'), f('programs','ARRAY'), f('leaderboardOptIn','BOOLEAN'), f('consentAt','DATETIME')] },
  { id: 'lms-players', displayName: 'LMS Players', permissions: P.adminWriteMemberRead, fields: [f('accountId','TEXT'), f('firstName','TEXT'), f('apelido','TEXT'), f('avatar','OBJECT'), f('birthYear','NUMBER'), f('program','TEXT'), f('startedAt','TEXT'), f('active','BOOLEAN'), f('mayPlayInClass','BOOLEAN'), f('xp','NUMBER'), f('level','NUMBER'), f('weekStreak','NUMBER'), f('lastActiveWeek','TEXT'), f('stars','NUMBER'), f('lessonsDone','NUMBER'), f('cordaCurrent','TEXT')] },
  { id: 'lms-events', displayName: 'LMS Events', permissions: P.memberAppend, fields: [f('playerId','TEXT'), f('accountId','TEXT'), f('type','TEXT'), f('moduleId','TEXT'), f('lessonId','TEXT'), f('xp','NUMBER'), f('stars','NUMBER'), f('payload','TEXT'), f('occurredAt','DATETIME'), f('clientEventId','TEXT'), f('source','TEXT')] },
  { id: 'lms-lesson-state', displayName: 'LMS Lesson State', permissions: P.memberOwn, fields: [f('playerId','TEXT'), f('lessonId','TEXT'), f('status','TEXT'), f('bestStars','NUMBER'), f('bestScore','NUMBER'), f('attempts','NUMBER'), f('firstDoneAt','DATETIME'), f('lastAt','DATETIME')] },
  { id: 'lms-patches', displayName: 'LMS Patches', permissions: P.catalog, fields: [f('key','TEXT'), f('title','TEXT'), f('subtitle','TEXT'), f('rule','TEXT'), f('art','TEXT'), f('tier','NUMBER'), f('sortOrder','NUMBER')] },
  { id: 'lms-patch-awards', displayName: 'LMS Patch Awards', permissions: P.adminWriteMemberRead, fields: [f('playerId','TEXT'), f('patchKey','TEXT'), f('earnedAt','DATETIME'), f('awardedBy','TEXT'), f('note','TEXT')] },
  { id: 'lms-corda-awards', displayName: 'LMS Corda Awards', permissions: P.adminWriteMemberRead, fields: [f('playerId','TEXT'), f('corda','TEXT'), f('event','TEXT'), f('awardedAt','DATETIME'), f('awardedBy','TEXT'), f('note','TEXT')] },
  { id: 'lms-attendance', displayName: 'LMS Attendance', permissions: P.adminWriteMemberRead, fields: [f('playerId','TEXT'), f('program','TEXT'), f('classDate','TEXT'), f('stampedBy','TEXT'), f('stampedAt','DATETIME')] },
  { id: 'lms-coach-events', displayName: 'LMS Coach Events', permissions: P.adminWriteMemberRead, fields: [f('playerId','TEXT'), f('accountId','TEXT'), f('type','TEXT'), f('xp','NUMBER'), f('stars','NUMBER'), f('payload','TEXT'), f('occurredAt','DATETIME'), f('clientEventId','TEXT'), f('source','TEXT')] },
  { id: 'lms-readiness-rules', displayName: 'LMS Readiness Rules', permissions: P.catalog, fields: [f('key','TEXT'), f('label','TEXT'), f('rule','TEXT'), f('program','TEXT'), f('active','BOOLEAN')] },
  { id: 'lms-leaderboard', displayName: 'LMS Leaderboard', permissions: P.serverOnly, fields: [f('program','TEXT'), f('period','TEXT'), f('entries','TEXT'), f('communityXp','NUMBER'), f('computedAt','DATETIME')] },
  { id: 'lms-programs', displayName: 'LMS Programs', permissions: P.adminOnly, fields: [f('key','TEXT'), f('name','TEXT'), f('dayOfWeek','TEXT'), f('inviteCode','TEXT'), f('coachIds','ARRAY'), f('active','BOOLEAN'), f('goalXp','NUMBER'), f('goalLabel','TEXT')] },
];
