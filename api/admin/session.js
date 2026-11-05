import { isAuthed, adminConfigured } from '../_lib/auth.js';
import { allow, send } from '../_lib/http.js';

export default function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  send(res, 200, { configured: adminConfigured(process.env.ADMIN_PASSWORD), authed: isAuthed(req) });
}
