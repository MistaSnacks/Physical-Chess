// demo-guard.js — WP6 routes return 501 { demo: true } when the OAuth
// client secret is missing so the browser can fall back to coachDemo.
import { json } from './session.js';

export function missingSecret() {
  return !process.env.WIX_CLIENT_SECRET;
}

export function demoResponse() {
  return json({ demo: true }, { status: 501 });
}
