import crypto from 'crypto';
import { env } from '../config/env.js';

// Stable per-visitor key. Logged-in -> "u:<userId>"; anonymous -> "a:<cookieId>"
// (issues an httpOnly `vid` cookie on first contact). Author exclusion is the
// service's job — it compares the resolved post's author to viewerId.
export const resolveVisitor = (req, res) => {
  const uid = req.user?.id;
  if (uid) return `u:${uid}`;

  let vid = req.cookies?.vid;
  if (!vid) {
    vid = crypto.randomUUID();
    res.cookie('vid', vid, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !env.isDev,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
  }
  return `a:${vid}`;
};
