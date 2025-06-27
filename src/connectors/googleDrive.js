const { google } = require('googleapis');
const stream = require('stream');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const getAuthUrl = () => {
    const scopes = ['https://www.googleapis.com/auth/drive'];
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
};

const authenticate = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
};

const listFiles = async () => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const res = await drive.files.list({
        pageSize: 20,
        fields: 'nextPageToken, files(id, name)',
    });
    return res.data.files;
};

const getFileMetadata = async (fileId) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const res = await drive.files.get({ fileId, fields: '*' });
    return res.data;
};

const downloadFile = async (fileId, mimeType) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    let response;
    if (mimeType === 'application/vnd.google-apps.document') {
        response = await drive.files.export({ fileId, mimeType: 'application/pdf' }, { responseType: 'stream' });
    } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
        response = await drive.files.export({ fileId, mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }, { responseType: 'stream' });
    } else if (mimeType === 'application/vnd.google-apps.presentation') {
        response = await drive.files.export({ fileId, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }, { responseType: 'stream' });
    } else {
        response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
    }

    return new Promise((resolve, reject) => {
        const buffer = [];
        response.data.on('data', (chunk) => buffer.push(chunk));
        response.data.on('end', () => resolve(Buffer.concat(buffer)));
        response.data.on('error', reject);
    });
};

const uploadFile = async (name, mimeType, buffer) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const res = await drive.files.create({
        requestBody: {
            name,
            mimeType,
        },
        media: {
            mimeType,
            body: stream.Readable.from(buffer),
        },
    });

    return res.data;
};

const deleteFile = async (fileId) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.delete({ fileId });
    return { success: true };
};

const renameFile = async (fileId, newName) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const res = await drive.files.update({
        fileId,
        requestBody: {
            name: newName,
        },
    });
    return res.data;
};

const createFolder = async (folderName) => {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const res = await drive.files.create({
        requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        },
    });

    return res.data;
};


module.exports = {
    getAuthUrl,
    authenticate,
    listFiles,
    getFileMetadata,
    downloadFile,
    uploadFile,
    renameFile,
    createFolder,
};
