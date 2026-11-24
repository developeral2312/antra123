const { google } = require('googleapis');
const stream = require('stream');
const { getDb } = require('./db');

/**
 * Get Google Drive configuration from Database or Environment Variables
 */
function getGoogleDriveConfig() {
  let config = {
    enabled: false,
    auth_mode: 'oauth',
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
    service_account_json: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
    root_folder_name: 'CUSTOMER DATABASE',
    root_folder_id: process.env.GOOGLE_ROOT_FOLDER_ID || '',
    status: 'disconnected'
  };

  try {
    const db = getDb();
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('google_drive_config');
    if (row && row.value) {
      const parsed = JSON.parse(row.value);
      config = { ...config, ...parsed };
      // Override with env if present
      if (process.env.GOOGLE_CLIENT_ID) config.client_id = process.env.GOOGLE_CLIENT_ID;
      if (process.env.GOOGLE_CLIENT_SECRET) config.client_secret = process.env.GOOGLE_CLIENT_SECRET;
      if (process.env.GOOGLE_REFRESH_TOKEN) config.refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
    }
  } catch (err) {
    console.error('Error loading Google Drive config from DB:', err.message);
  }

  // Check if configured
  if (config.auth_mode === 'service_account' && config.service_account_json) {
    config.enabled = true;
  } else if (config.client_id && config.client_secret && config.refresh_token) {
    config.enabled = true;
  }

  return config;
}

/**
 * Initialize Google Drive API v3 client
 */
function getDriveClient() {
  const config = getGoogleDriveConfig();

  if (config.auth_mode === 'service_account' && config.service_account_json) {
    let credentials;
    try {
      credentials = typeof config.service_account_json === 'string'
        ? JSON.parse(config.service_account_json)
        : config.service_account_json;
    } catch (e) {
      throw new Error('Invalid Google Service Account JSON: ' + e.message);
    }

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    return { drive: google.drive({ version: 'v3', auth }), authType: 'service_account', email: credentials.client_email };
  }

  if (config.client_id && config.client_secret && config.refresh_token) {
    const oAuth2Client = new google.auth.OAuth2(
      config.client_id,
      config.client_secret,
      'urn:ietf:wg:oauth:2.0:oob'
    );

    oAuth2Client.setCredentials({
      refresh_token: config.refresh_token
    });

    return { drive: google.drive({ version: 'v3', auth: oAuth2Client }), authType: 'oauth' };
  }

  return null;
}

/**
 * Test Google Drive Connection
 */
async function testDriveConnection() {
  try {
    const client = getDriveClient();
    if (!client) {
      return {
        success: false,
        status: 'disconnected',
        message: 'Google Drive credentials not configured. Please provide OAuth credentials or Service Account JSON.'
      };
    }

    const res = await client.drive.about.get({
      fields: 'user, storageQuota'
    });

    return {
      success: true,
      status: 'connected',
      authType: client.authType,
      user: res.data.user,
      storageQuota: res.data.storageQuota,
      message: 'Successfully connected to Google Drive API v3'
    };
  } catch (err) {
    return {
      success: false,
      status: 'error',
      message: err.message || 'Failed to authenticate with Google Drive'
    };
  }
}

/**
 * Find or create a folder in Google Drive
 */
async function findOrCreateFolder(drive, folderName, parentId = null) {
  let query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const listRes = await drive.files.list({
    q: query,
    fields: 'files(id, name, parents)',
    spaces: 'drive'
  });

  if (listRes.data.files && listRes.data.files.length > 0) {
    return listRes.data.files[0].id;
  }

  // Create folder
  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentId) {
    fileMetadata.parents = [parentId];
  }

  const folder = await drive.files.create({
    resource: fileMetadata,
    fields: 'id, name, webViewLink'
  });

  return folder.data.id;
}

/**
 * Upload a file to Google Drive
 */
async function uploadToDrive(drive, { name, mimeType, buffer, parentId }) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buffer);

  const fileMetadata = {
    name,
    parents: parentId ? [parentId] : []
  };

  const media = {
    mimeType,
    body: bufferStream
  };

  const response = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name, webViewLink, webContentLink, size'
  });

  return response.data;
}

module.exports = {
  getGoogleDriveConfig,
  getDriveClient,
  testDriveConnection,
  findOrCreateFolder,
  uploadToDrive
};
