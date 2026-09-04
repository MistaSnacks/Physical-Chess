// wix-data.js — Wix Data Items REST v2 + Members Delete Member.
// Written against https://dev.wix.com/docs/api-reference/business-solutions/cms/data-items
// and https://dev.wix.com/docs/api-reference/crm/members-contacts/members/member-management/members/delete-member
// Auth: OAuth app client_credentials token (adminToken) + wix-site-id.
import { adminToken } from './session.js';

const DATA = 'https://www.wixapis.com/wix-data/v2';
const MEMBERS = 'https://www.wixapis.com/members/v1';

export const C = {
  accounts: 'lms-accounts',
  players: 'lms-players',
  events: 'lms-events',
  lessonState: 'lms-lesson-state',
  patchAwards: 'lms-patch-awards',
  cordaAwards: 'lms-corda-awards',
  attendance: 'lms-attendance',
  leaderboard: 'lms-leaderboard',
  programs: 'lms-programs',
};

function siteHeaders(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: token,
    'wix-site-id': process.env.WIX_SITE_ID || '',
  };
}

async function parse(res) {
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`Wix ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export async function adminHeaders() {
  const token = await adminToken();
  return siteHeaders(token);
}

function unwrap(item) {
  if (!item) return null;
  const data = item.data || {};
  return { ...data, id: item.id || data._id, _id: item.id || data._id };
}

/** POST /wix-data/v2/items/query — pages until exhausted, cap 2000. */
export async function queryItems(collection, query = {}, { consistentRead = false, cap = 2000 } = {}) {
  const H = await adminHeaders();
  const items = [];
  let offset = 0;
  const limit = Math.min(query.paging?.limit || 100, 100);
  for (;;) {
    const body = {
      dataCollectionId: collection,
      consistentRead,
      query: {
        filter: query.filter || {},
        sort: query.sort,
        paging: { limit, offset },
      },
    };
    if (!body.query.sort) delete body.query.sort;
    const data = await parse(await fetch(`${DATA}/items/query`, { method: 'POST', headers: H, body: JSON.stringify(body) }));
    const batch = (data.dataItems || []).map(unwrap);
    items.push(...batch);
    if (batch.length < limit || items.length >= cap) break;
    offset += limit;
    if (data.pagingMetadata?.hasNext === false) break;
  }
  return items.slice(0, cap);
}

/** POST /wix-data/v2/items */
export async function insertItem(collection, data) {
  const H = await adminHeaders();
  const res = await parse(await fetch(`${DATA}/items`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ dataCollectionId: collection, dataItem: { data } }),
  }));
  return unwrap(res.dataItem);
}

/** PUT /wix-data/v2/items/{dataItemId} — replaces the item payload. */
export async function updateItem(collection, id, data) {
  const H = await adminHeaders();
  const res = await parse(await fetch(`${DATA}/items/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ dataCollectionId: collection, dataItem: { id, data: { ...data, _id: id } } }),
  }));
  return unwrap(res.dataItem);
}

/** DELETE /wix-data/v2/items/{dataItemId}?dataCollectionId= */
export async function removeItem(collection, id) {
  const H = await adminHeaders();
  await parse(await fetch(`${DATA}/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(collection)}`, {
    method: 'DELETE',
    headers: H,
  }));
}

/** POST /wix-data/v2/bulk/items/insert */
export async function bulkInsert(collection, rows) {
  if (!rows.length) return [];
  const H = await adminHeaders();
  const out = [];
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const res = await parse(await fetch(`${DATA}/bulk/items/insert`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ dataCollectionId: collection, dataItems: chunk.map((data) => ({ data })) }),
    }));
    const results = res.results || res.bulkResults || [];
    for (const r of results) {
      if (r.item) out.push(unwrap(r.item));
      else if (r.dataItem) out.push(unwrap(r.dataItem));
    }
  }
  return out;
}

/** POST /wix-data/v2/bulk/items/remove */
export async function bulkRemove(collection, ids) {
  if (!ids.length) return;
  const H = await adminHeaders();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    await parse(await fetch(`${DATA}/bulk/items/remove`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({ dataCollectionId: collection, dataItemIds: chunk }),
    }));
  }
}

/** GET /wix-data/v2/items/{id}?dataCollectionId= */
export async function getItem(collection, id) {
  const H = await adminHeaders();
  const res = await parse(await fetch(`${DATA}/items/${encodeURIComponent(id)}?dataCollectionId=${encodeURIComponent(collection)}`, { headers: H }));
  return unwrap(res.dataItem);
}

/** DELETE /members/v1/members/{id} */
export async function deleteWixMember(memberId) {
  const H = await adminHeaders();
  const res = await fetch(`${MEMBERS}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE', headers: H });
  if (res.status === 404) return;
  await parse(res);
}

export function parsePayload(value) {
  if (value == null || value === '') return {};
  if (typeof value === 'object' && !Array.isArray(value) && !value.$date) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return {}; }
  }
  return {};
}

export function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.$date) return value.$date;
  return new Date(value).toISOString();
}

export function fromEventRow(r) {
  return {
    clientEventId: r.clientEventId,
    playerId: r.playerId,
    accountId: r.accountId,
    type: r.type,
    moduleId: r.moduleId || null,
    lessonId: r.lessonId || null,
    payload: parsePayload(r.payload),
    xp: r.xp || 0,
    stars: r.stars || 0,
    occurredAt: parseDate(r.occurredAt) || r.occurredAt,
    source: r.source || 'app',
    _id: r._id || r.id,
  };
}

export function fromPlayerRow(r) {
  return {
    id: r._id || r.id,
    accountId: r.accountId,
    firstName: r.firstName,
    apelido: r.apelido || '',
    avatar: r.avatar || { animal: 'frog', color: 'lime' },
    birthYear: r.birthYear || null,
    program: r.program || null,
    startedAt: r.startedAt || null,
    active: r.active !== false,
    mayPlayInClass: r.mayPlayInClass !== false,
    xp: r.xp,
    level: r.level,
    weekStreak: r.weekStreak,
    lastActiveWeek: r.lastActiveWeek,
    stars: r.stars,
    lessonsDone: r.lessonsDone,
    cordaCurrent: r.cordaCurrent,
  };
}

export function fromAccountRow(r) {
  return {
    id: r._id || r.id,
    memberId: r.memberId,
    role: r.role || 'guardian',
    displayName: r.displayName || '',
    email: r.email || '',
    phone: r.phone || '',
    programs: r.programs || [],
    leaderboardOptIn: r.leaderboardOptIn === true,
    demo: false,
  };
}
