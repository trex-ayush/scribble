// "Return to where you were after login" via a ?next= query param — visible in
// the URL and survives reloads (unlike router state).

// Append a validated return path to an auth route. Omitted for home so the URL
// stays clean (e.g. withNext('/login', '/post/x') -> '/login?next=%2Fpost%2Fx').
export const withNext = (path, next) =>
  next && next !== '/' ? `${path}?next=${encodeURIComponent(next)}` : path;

// Read a `next` value back safely: only same-site absolute paths — never an
// auth page (avoids loops) or an external/protocol-relative URL (open redirect).
export const safeNext = (value) =>
  value &&
  value.startsWith('/') &&
  !value.startsWith('//') &&
  !value.startsWith('/login') &&
  !value.startsWith('/register')
    ? value
    : '/';
