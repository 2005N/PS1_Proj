const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');
const crypto = require('crypto');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

//Generates a random PKCE verifier and its corresponding PKCE challenge.
const generatePKCECodes = () => {
    const pkceVerifier = crypto.randomBytes(32).toString('base64url');
    const pkceChallenge = crypto.createHash('sha256').update(pkceVerifier).digest('base64url');
    return { pkceVerifier, pkceChallenge };
};

//Constructs the Dropbox authorization URL with the necessary parameters
const getAuthUrl = (pkceChallenge) => {
    const params = {
        response_type: 'code',
        client_id: process.env.DROPBOX_CLIENT_ID,
        redirect_uri: process.env.DROPBOX_REDIRECT_URI,
        code_challenge: pkceChallenge,
        code_challenge_method: 'S256'
    };
    return `https://www.dropbox.com/oauth2/authorize?${querystring.stringify(params)}`;
};

//Exchanges the authorization code for an access token using the PKCE verifier
const authenticate = async (code, pkceVerifier) => {
    const response = await fetch('https://api.dropbox.com/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: querystring.stringify({
            code: code,
            grant_type: 'authorization_code',
            client_id: process.env.DROPBOX_CLIENT_ID,
            redirect_uri: process.env.DROPBOX_REDIRECT_URI,
            code_verifier: pkceVerifier
        })
    });
    const data = await response.json();
    return data;
};

const listFiles = async (accessToken) => {
    const dbx = new Dropbox({ accessToken, fetch });
    const response = await dbx.filesListFolder({ path: '' });
    return response.result.entries;
};

const ensureDirectoryExistence = (filePath) => {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return true;
    }
    ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
};

const downloadFile = async (accessToken, filePath, destination) => {
    const dbx = new Dropbox({ accessToken, fetch });
    const response = await dbx.filesDownload({ path: filePath });

    const fileName = response.result.name;
    const fileData = response.result.fileBinary;

    let outputFilePath = destination;
    if (!outputFilePath) {
        outputFilePath = path.join(__dirname, '..', 'downloads', fileName);
    }

    ensureDirectoryExistence(outputFilePath);
    fs.writeFileSync(outputFilePath, fileData, 'binary');

    return { fileName, outputFilePath };
};

const uploadFile = async (accessToken, file, destinationPath) => {
    const dbx = new Dropbox({ accessToken, fetch });
    const fileContent = fs.readFileSync(file.path);
    const response = await dbx.filesUpload({
        path: destinationPath,
        contents: fileContent,
        mode: 'add',
        autorename: true,
        mute: false
    });
    return response.result;
};

const deleteFile = async (accessToken, filePath) => {
    const dbx = new Dropbox({ accessToken, fetch });
    const response = await dbx.filesDeleteV2({ path: filePath });
    return response.result;
};

module.exports = {
    generatePKCECodes,
    getAuthUrl,
    authenticate,
    listFiles,
    downloadFile,
    uploadFile,
    deleteFile
};
