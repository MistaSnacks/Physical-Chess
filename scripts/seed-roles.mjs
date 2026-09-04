// seed-roles.mjs — promote Camren and Pastor to admin by Wix member ID.
// Needs WIX_CLIENT_SECRET + PUBLIC_WIX_CLIENT_ID + WIX_SITE_ID.
// Set CAMREN_MEMBER_ID and PASTOR_MEMBER_ID (from the Wix Members dashboard).
const {
  WIX_CLIENT_SECRET, PUBLIC_WIX_CLIENT_ID, WIX_SITE_ID,
  CAMREN_MEMBER_ID, PASTOR_MEMBER_ID,
} = process.env;

if (!WIX_CLIENT_SECRET || !PUBLIC_WIX_CLIENT_ID || !WIX_SITE_ID) {
  console.error('Set PUBLIC_WIX_CLIENT_ID, WIX_CLIENT_SECRET and WIX_SITE_ID first.');
  process.exit(1);
}

const ids = [
  { label: 'Camren', memberId: CAMREN_MEMBER_ID },
  { label: 'Pastor', memberId: PASTOR_MEMBER_ID },
].filter((x) => x.memberId);

if (!ids.length) {
  console.error('Set CAMREN_MEMBER_ID and/or PASTOR_MEMBER_ID.');
  process.exit(1);
}

const tokenRes = await fetch('https://www.wixapis.com/oauth2/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: PUBLIC_WIX_CLIENT_ID,
    client_secret: WIX_CLIENT_SECRET,
    instance_id: WIX_SITE_ID,
  }),
});
const { access_token } = await tokenRes.json();
if (!access_token) { console.error('token exchange failed'); process.exit(1); }
const H = { 'Content-Type': 'application/json', Authorization: access_token, 'wix-site-id': WIX_SITE_ID };

for (const person of ids) {
  const found = await fetch('https://www.wixapis.com/wix-data/v2/items/query', {
    method: 'POST',
    headers: H,
    body: JSON.stringify({
      dataCollectionId: 'lms-accounts',
      query: { filter: { memberId: { $eq: person.memberId } }, paging: { limit: 5 } },
    }),
  });
  const data = await found.json();
  const item = (data.dataItems || [])[0];
  if (!item) {
    console.log('no lms-accounts row yet for', person.label, person.memberId, '— they need to sign in once first.');
    continue;
  }
  const next = { ...item.data, role: 'admin', programs: item.data.programs || [] };
  const res = await fetch(`https://www.wixapis.com/wix-data/v2/items/${item.id}`, {
    method: 'PUT',
    headers: H,
    body: JSON.stringify({ dataCollectionId: 'lms-accounts', dataItem: { id: item.id, data: next } }),
  });
  console.log(res.ok ? 'admin' : 'failed', person.label, res.ok ? '' : await res.text());
}
