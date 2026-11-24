import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const bcrypt = require('bcryptjs');
const { getDb } = require('@/lib/db');

export async function PUT(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, email, current_password, new_password } = await req.json();

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE id = ?').get(user.id);

    if (!admin) {
      return NextResponse.json({ error: 'Admin account not found' }, { status: 404 });
    }

    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }

      const match = bcrypt.compareSync(current_password, admin.password_hash);
      if (!match) {
        return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(new_password, salt);
      db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(newHash, admin.id);
    }

    if (name || email) {
      db.prepare(`
        UPDATE admin_users 
        SET name = ?, email = ?
        WHERE id = ?
      `).run(name || admin.name, email ? email.toLowerCase() : admin.email, admin.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin profile updated successfully',
      user: {
        id: admin.id,
        name: name || admin.name,
        email: email || admin.email
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
