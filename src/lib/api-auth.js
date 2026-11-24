import { cookies } from 'next/headers';
const { verifyToken, COOKIE_NAME } = require('./auth');

export function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
