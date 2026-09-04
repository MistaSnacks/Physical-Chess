// POST /api/shop/order — insert a uniform-top order into Wix `contactForm3`.
import { adminToken, json } from '../../../lib/server/session.js';

export const prerender = false;

function clean(v) {
  return String(v || '').trim().slice(0, 500);
}

export async function POST({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Fill in the order form.' }, { status: 400 }); }

  const parentsName = clean(body.parentsName);
  const childName = clean(body.childName);
  const shirtSize = clean(body.shirtSize);
  const pantSize = clean(body.pantSize);
  const email = clean(body.email);
  const schoolProgram = clean(body.schoolProgram);
  const contact = clean(body.contact);

  if (!parentsName || !childName || !shirtSize || !pantSize || !email || !schoolProgram || !contact) {
    return json({ ok: false, error: 'Every field is required.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'That email does not look right.' }, { status: 400 });

  const childsNameShirtPan = `${childName} · shirt ${shirtSize} · pant ${pantSize}`;
  const schoolProgramAndChild = `${schoolProgram} · ${childName}`;
  const submissionTime = new Date().toISOString();

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
        dataCollectionId: 'contactForm3',
        dataItem: {
          data: {
            parentsName,
            childsNameShirtPan,
            email,
            schoolProgramAndChild,
            contact,
            submissionTime,
          },
        },
      }),
    });
    if (!res.ok) return json({ ok: false, error: 'Could not send the order. Email info@the-ace.org instead.' }, { status: 502 });
    return json({ ok: true });
  } catch {
    return json({ ok: false, error: 'Could not send the order. Email info@the-ace.org instead.' }, { status: 502 });
  }
}
