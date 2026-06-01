import dotenv from 'dotenv';
dotenv.config();

const isDev = process.env.NODE_ENV !== 'production';

// Express `trust proxy` value, so req.ip (and rate-limit keying) reflects the
// real client behind a reverse proxy. Default: 1 hop in prod, 0 in dev.
const _parseTrustProxy = (v) => {
  if (v === undefined) return isDev ? 0 : 1;
  if (v === 'true' || v === 'false') return v === 'true';
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? v : n; // allow subnet/'loopback' strings
};

const _required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

// Known placeholders shipped in .env.example — must never reach production.
const _WEAK_SECRETS = [
  'your_super_secret', 'your_refresh',
  'your_super_secret_jwt_key_change_this', 'your_refresh_secret_change_this',
];

// A short or guessable JWT secret lets an attacker brute-force it and FORGE
// valid access tokens for any user (full account takeover). This warns loudly
// (it does NOT throw, to avoid taking down a running deployment). Once the
// secret is rotated to a strong value, switch the `console.warn` below to a
// `throw` so a misconfigured production can never start.
const _secret = (key) => {
  const val = _required(key);
  const weak = val.length < 32 || _WEAK_SECRETS.includes(val);
  if (weak) {
    console.warn(
      `[SECURITY] ${key} is weak/guessable — rotate it to a random 32+ char ` +
      'secret (e.g. `openssl rand -base64 48`). Existing tokens will be invalidated.'
    );
  }
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: _required('MONGODB_URI'),
  JWT_SECRET: _secret('JWT_SECRET'),
  // Short-lived access token: limits the window a stolen/leaked token is
  // usable. The client's refresh interceptor renews it transparently.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: _secret('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  TRUST_PROXY: _parseTrustProxy(process.env.TRUST_PROXY),
  isDev,
};
