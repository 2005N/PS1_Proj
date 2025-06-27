const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const router = express.Router();
const { generatePKCECodes, getAuthUrl, authenticate, listFiles, downloadFile, uploadFile, deleteFile } = require('../connectors/dropbox');

// Store the PKCE verifier in memory for simplicity
let pkceVerifier = null;

//Initiates the authentication process by generating PKCE codes and redirecting the user to the Dropbox authorization URL
router.get('/auth', (req, res) => {
    const { pkceVerifier: verifier, pkceChallenge } = generatePKCECodes();
    pkceVerifier = verifier; // Save the PKCE verifier to use later in the callback
    const url = getAuthUrl(pkceChallenge);
    res.redirect(url);
});

//Handles the OAuth callback, exchanges the authorization code for an access token, and generates an
// HTML page with links and forms for listing, uploading, and deleting files
router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokens = await authenticate(code, pkceVerifier);
        console.log(tokens.access_token);
        res.send(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document Integrator</title>
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                <a href="/dropbox/files?token=${tokens.access_token}">List files</a><br><br><br><br>
                <form id="upload-form" action="/dropbox/upload" method="post" enctype="multipart/form-data">
                    <input type="hidden" name="token" value="${tokens.access_token}">
                    <input type="file" name="file" id="file-input">
                    <input type="text" name="destination" placeholder="Dropbox destination path">
                    <button type="submit">Upload</button>
                </form><br><br>
                <form id="delete-form" action="/dropbox/delete" method="post">
                    <input type="hidden" name="token" value="${tokens.access_token}">
                    <input type="text" name="path" placeholder="Dropbox file path to delete">
                    <button type="submit">Delete</button>
                </form>
            </body>
            </html>`)
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.get('/files', async (req, res) => {
    const accessToken = req.query.token; 
    try {
        const files = await listFiles(accessToken);
        const filesJson = JSON.stringify(files);
        res.send(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document Integrator</title>
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                <div id="file-list"></div>
                <script>
                    const files = ${filesJson};
                    const accessToken = '${accessToken}';
                    // Function to display files
                    function displayFiles(files) {
                        const fileList = document.getElementById('file-list');
                        fileList.innerHTML = '';
                        files.forEach(file => {
                            const fileItem = document.createElement('div');
                            fileItem.textContent = file.name;
                            const downloadLink = document.createElement('a');
                            downloadLink.href = \`/dropbox/download?token=\${accessToken}&path=\${encodeURIComponent(file.path_lower)}\`;
                            downloadLink.textContent = 'Download';
                            fileList.appendChild(fileItem);
                            fileList.appendChild(downloadLink);
                            fileList.appendChild(document.createElement('br')); // Add a line break
                        });
                    }

                    displayFiles(files);
                </script>
            </body>
            </html>`);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.get('/download', async (req, res) => {
    const accessToken = req.query.token; 
    const filePath = req.query.path; // Dropbox path to the file
    const destination = req.query.destination; // Optional local destination path

    try {
        const { fileName, outputFilePath } = await downloadFile(accessToken, filePath, destination);
        res.download(outputFilePath, fileName);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    const accessToken = req.body.token; 
    const file = req.file;
    const destinationPath = req.body.destination;

    try {
        const result = await uploadFile(accessToken, file, destinationPath);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/delete', async (req, res) => {
    const accessToken = req.body.token; 
    const filePath = req.body.path;

    try {
        const result = await deleteFile(accessToken, filePath);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

module.exports = router;
