// coachRepo.js — browser client for /api/coach/* (and related). When the
// server has no WIX_CLIENT_SECRET it returns 501 { demo: true } and we
// fall back to coachDemo so every screen still works.
import { IS_DEMO } from './index.js';
import { authHeaders } from './wixRepo.js';

async function headers() {
  try { return { 'Content-Type': 'application/json', ...(await authHeaders()) }; }
  catch { return { 'Content-Type': 'application/json' }; }
}

async function demo() {
  const { coachDemo } = await import('./coachDemo.js');
  await coachDemo.ensure();
  return coachDemo;
}

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: await headers(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  if (res.status === 501) return { demo: true, fallback: true };
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function q(params) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v != null && v !== '') s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : '';
}

export const coachRepo = {
  name: 'coach-api',
  isDemo: false,

  async roster(program) {
    const data = await call('/api/coach/roster' + q({ program }));
    if (data?.fallback) return (await demo()).roster(program);
    return data.players || [];
  },
  async overview(program) {
    const rows = await this.roster(program);
    const { overviewFromRoster } = await import('../coach.js');
    return overviewFromRoster(rows);
  },
  async player(id) {
    const data = await call('/api/coach/players/' + encodeURIComponent(id));
    if (data?.fallback) return (await demo()).player(id);
    return data;
  },
  async stampAttendance(body) {
    const data = await call('/api/coach/attendance', { method: 'POST', body });
    if (data?.fallback) return (await demo()).stampAttendance(body);
    return data;
  },
  async award(body) {
    const data = await call('/api/coach/award', { method: 'POST', body });
    if (data?.fallback) return (await demo()).award(body);
    return data;
  },
  async setGoal(body) {
    const data = await call('/api/coach/goal', { method: 'POST', body });
    if (data?.fallback) return (await demo()).setGoal(body);
    return data;
  },
  async goals() {
    const data = await call('/api/coach/goal');
    if (data?.fallback) return (await demo()).goals();
    return data.goals || data;
  },
  async leaderboard({ program, period }) {
    const data = await call('/api/leaderboard' + q({ program, period }));
    if (data?.fallback) return (await demo()).leaderboard({ program, period });
    return data;
  },
  async exportData({ scope, format, what, program }) {
    const res = await fetch('/api/export' + q({ scope, format, what, program }), {
      headers: await headers(),
      credentials: 'same-origin',
    });
    if (res.status === 501) return (await demo()).exportData({ scope, format, what, program });
    if (!res.ok) throw new Error('export failed');
    if (format === 'json') return res.json();
    return res.text();
  },
  async listAccounts() {
    const data = await call('/api/admin/roles');
    if (data?.fallback) return (await demo()).listAccounts();
    return data.accounts || [];
  },
  async setRole(body) {
    const data = await call('/api/admin/roles', { method: 'POST', body });
    if (data?.fallback) return (await demo()).setRole(body);
    return data.account || data;
  },
};

export async function getCoach() {
  if (IS_DEMO) return demo();
  return coachRepo;
}
