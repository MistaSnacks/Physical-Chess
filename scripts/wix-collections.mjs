// wix-collections.mjs — create or update the lms-* collections on the site.
// Idempotent. Needs WIX_CLIENT_SECRET + PUBLIC_WIX_CLIENT_ID + WIX_SITE_ID
// (client_credentials grant, SPEC §2.1). Run: npm run wix:collections
import { COLLECTIONS } from './collections.mjs';

const { WIX_CLIENT_SECRET, PUBLIC_WIX_CLIENT_ID, WIX_SITE_ID } = process.env;
if (!WIX_CLIENT_SECRET || !PUBLIC_WIX_CLIENT_ID || !WIX_SITE_ID) {
  console.error('Set PUBLIC_WIX_CLIENT_ID, WIX_CLIENT_SECRET and WIX_SITE_ID first.');
  process.exit(1);
}

const tokenRes = await fetch('https://www.wixapis.com/oauth2/token', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ grant_type: 'client_credentials', client_id: PUBLIC_WIX_CLIENT_ID, client_secret: WIX_CLIENT_SECRET, instance_id: WIX_SITE_ID }),
});
const { access_token } = await tokenRes.json();
if (!access_token) { console.error('token exchange failed', await tokenRes.text()); process.exit(1); }
const H = { 'Content-Type': 'application/json', Authorization: access_token, 'wix-site-id': WIX_SITE_ID };

const existing = await (await fetch('https://www.wixapis.com/wix-data/v2/collections', { headers: H })).json();
const have = new Set((existing.collections || []).map((c) => c.id));

for (const c of COLLECTIONS) {
  if (have.has(c.id)) {
    const res = await fetch(`https://www.wixapis.com/wix-data/v2/collections/${c.id}`, { method: 'PATCH', headers: H, body: JSON.stringify({ collection: { id: c.id, displayName: c.displayName, fields: c.fields, permissions: c.permissions } }) });
    console.log(res.ok ? 'updated' : 'update failed', c.id, res.ok ? '' : await res.text());
  } else {
    const res = await fetch('https://www.wixapis.com/wix-data/v2/collections', { method: 'POST', headers: H, body: JSON.stringify({ collection: c }) });
    console.log(res.ok ? 'created' : 'create failed', c.id, res.ok ? '' : await res.text());
  }
}
