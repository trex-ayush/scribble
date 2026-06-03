import crypto from 'crypto';

export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const browserOf = (ua) => {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return '';
};

const osOf = (ua) => {
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X|Macintosh/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return '';
};

// Friendly device label from a User-Agent string, e.g. "Chrome on Windows".
export const parseDevice = (ua = '') => {
  const browser = browserOf(ua);
  const os = osOf(ua);
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || 'Unknown device';
};
