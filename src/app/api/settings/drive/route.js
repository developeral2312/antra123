import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
const { getDb } = require('@/lib/db');
const { getGoogleDriveConfig, testDriveConnection } = require('@/lib/drive');

export async function GET() {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = getGoogleDriveConfig();
  // Don't expose client_secret or private_key in plaintext
  const sanitized = {
    enabled: config.enabled,
    auth_mode: config.auth_mode,
    client_id: config.client_id ? `${config.client_id.substring(0, 8)}...` : '',
    has_client_secret: !!config.client_secret,
    has_refresh_token: !!config.refresh_token,
    has_service_account: !!config.service_account_json,
    root_folder_name: config.root_folder_name || 'CUSTOMER DATABASE',
    root_folder_id: config.root_folder_id || '',
    status: config.status
  };

  return NextResponse.json({ config: sanitized });
}

export async function POST(req) {
  const user = getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, auth_mode, client_id, client_secret, refresh_token, service_account_json, root_folder_name } = body;

    const db = getDb();

    if (action === 'test') {
      const result = await testDriveConnection();
      return NextResponse.json(result);
    }

    // Save config
    const currentConfig = getGoogleDriveConfig();
    const newConfig = {
      ...currentConfig,
      auth_mode: auth_mode || currentConfig.auth_mode,
      root_folder_name: root_folder_name || 'CUSTOMER DATABASE'
    };

    if (client_id !== undefined) newConfig.client_id = client_id;
    if (client_secret !== undefined && client_secret !== '') newConfig.client_secret = client_secret;
    if (refresh_token !== undefined && refresh_token !== '') newConfig.refresh_token = refresh_token;
    if (service_account_json !== undefined && service_account_json !== '') newConfig.service_account_json = service_account_json;

    // Check test connection
    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run('google_drive_config', JSON.stringify(newConfig), new Date().toISOString());

    const testRes = await testDriveConnection();
    newConfig.status = testRes.success ? 'connected' : 'error';

    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `).run('google_drive_config', JSON.stringify(newConfig), new Date().toISOString());

    return NextResponse.json({
      success: true,
      message: 'Google Drive configuration saved',
      connectionTest: testRes
    });
  } catch (err) {
    console.error('Settings error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update Google Drive settings' }, { status: 500 });
  }
}
