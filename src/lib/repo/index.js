// index.js — pick the repo once per page. Demo when PUBLIC_DEMO=1 or no
// Wix client ID is configured (SPEC §2.2).
import { localRepo } from './localRepo.js';
import { assertRepo } from './interface.js';

export const IS_DEMO = import.meta.env.PUBLIC_DEMO === '1' || !import.meta.env.PUBLIC_WIX_CLIENT_ID;

let repo = null;
export async function getRepo() {
  if (repo) return repo;
  if (IS_DEMO) {
    repo = assertRepo(localRepo, 'local');
  } else {
    const { wixRepo } = await import('./wixRepo.js');
    repo = assertRepo(wixRepo, 'wix');
  }
  return repo;
}
