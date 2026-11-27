import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { query } = require('@/lib/db');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = await query(
    'SELECT id, email, name, role, created_at FROM admin_users WHERE id = $1',
    [user.id]
  );
  const dbUser = res.rows[0];
  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser });
}
