// Header names used by the middleware to forward the already-verified user
// identity to route handlers and server components. This lets request handlers
// trust the JWT the middleware just verified instead of re-verifying it over the
// network on every request. The middleware always strips any client-supplied
// values for these headers before setting them, so they can't be spoofed.
export const USER_ID_HEADER = "x-rl-user-id"
export const USER_EMAIL_HEADER = "x-rl-user-email"
