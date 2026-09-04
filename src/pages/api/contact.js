// POST /api/contact — insert a row into the Wix `contactForm` collection.
import { adminToken, json } from '../../lib/server/session.js';

export const prerender = false;

function clean(v) {
  return String(v || '').trim().slice(0, 4000);
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Send a name, email, and message.' }, { status: 400 }); }
  const name = clean(body.name);
  const email = clean(body.email);
  const message = clean(body.message);
  if (!name || !email || !message) return json({ ok: false, error: 'Name, email, and message are required.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'That email does not look right.' }, { status: 400 });

  if (!process.env.WIX_CLIENT_SECRET) return json({ ok: true, demo: true });

  try {
    const token = await adminToken();
    const res = await fetch('https://www.wixapis.com/wix-data/v2/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
        'wix-site-id': process.env.WIX_SITE_ID || '',
      },
      body: JSON.stringify({
        dataCollectionId: 'contactForm',
        dataItem: {
          data: { name, email, message, submissionTime: new Date().toISOString() },
        },
      }),
    });
    if (!res.ok) return json({ ok: false, error: 'Could not send right now. Email info@the-ace.org instead.' }, { status: 502 });
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Could not send right now. Email info@the-ace.org instead.' }, { status: 502 });
  }
}
