// interface.js — the one door to student data (SPEC §0 decision 5).
// Both implementations (localRepo = demo, wixRepo = Wix Members + CMS)
// resolve the same promises. Screens never import a repo directly; they
// go through src/lib/actions.js → getRepo().
//
// Types (JSDoc, plain objects):
//   Account { id, memberId, role: 'guardian'|'coach'|'admin', displayName, email, programs: string[], leaderboardOptIn, demo }
//   Player  { id, accountId, firstName, apelido, avatar: { animal, color }, birthYear, program, startedAt, active, mayPlayInClass }
//   Event   see src/lib/game/events.js makeEvent()
//
// Methods every repo implements:
//   getSession()                     → { account, players } | null
//   signOut()                        → void
//   createPlayer(data)               → Player
//   updatePlayer(id, patch)          → Player
//   deletePlayer(id)                 → void
//   listEvents(playerId)             → Event[]
//   appendEvents(playerId, events)   → Event[] (accepted; duplicates by clientEventId dropped)
//   updateAccount(patch)             → Account   (displayName, phone, leaderboardOptIn only in Wix mode)
//   checkInvite(code)                → { key, name } | null (SPEC-v3 R15.12; codes never ship in content)
// createPlayer/updatePlayer take `inviteCode` (and `leaveProgram` on update);
// the program is set only from a valid code, never from a `program` field.
// localRepo adds: signInDemo()
// wixRepo adds:   listClassEvents(playerId) for Class mode across families (R15.4)

export const REPO_METHODS = ['getSession', 'signOut', 'createPlayer', 'updatePlayer', 'deletePlayer', 'listEvents', 'appendEvents', 'updateAccount', 'checkInvite'];

export function assertRepo(repo, name) {
  for (const m of REPO_METHODS) {
    if (typeof repo[m] !== 'function') throw new Error(`repo ${name} is missing ${m}()`);
  }
  return repo;
}
