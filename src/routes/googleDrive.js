const express = require('express');
const router = express.Router();
const { getAuthUrl, authenticate, listFiles, getFileMetadata, downloadFile, uploadFile, renameFile, createFolder } = require('../connectors/googleDrive');
const multer = require('multer');
const upload = multer();

router.get('/auth', (req, res) => {
    const url = getAuthUrl();
    res.redirect(url);
});

router.get('/oauth2callback', async (req, res) => {
    const code = req.query.code;
    try {
        const tokens = await authenticate(code);
        console.log(tokens.access_token);
        //res.sendFile(path.join(__dirname, 'public', 'oauth2callback.html'));
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Document Integrator</title>
                <style>
                    body {
                        font-family: 'Segoe UI', sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-top: 100px;
                        background-color: #f8f9fa;
                    }
                    a {
                        background-color: #007bff;
                        color: white;
                        text-decoration: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        font-weight: bold;
                    }
                    a:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <h2>Authentication Successful!</h2>
                <a href="/google-drive/files">Go to File Manager</a>
            </body>
            </html>
        `);

    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.get('/files', async (req, res) => {
    try {
        const files = await listFiles();
        const filesJson = JSON.stringify(files);
        //res.sendFile(path.join(__dirname, 'public', 'files.html'));
        res.render('googleDrive/files', { files });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.get('/files/:fileId/metadata', async (req, res) => {
    const fileId = req.params.fileId;
    try {
        const metadata = await getFileMetadata(fileId);
        res.json(metadata);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.get('/files/:fileId/download', async (req, res) => {
    const fileId = req.params.fileId;
    try {
        const metadata = await getFileMetadata(fileId);
        const mimeType = metadata.mimeType;
        const fileBuffer = await downloadFile(fileId, mimeType);

        let extension = 'bin';
        if (mimeType === 'application/pdf') {
            extension = 'pdf';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            extension = 'xlsx';
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            extension = 'pptx';
        }

        res.setHeader('Content-Disposition', `attachment; filename="${metadata.name}.${extension}"`);
        res.setHeader('Content-Type', mimeType);
        res.send(fileBuffer);
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const { originalname, mimetype, buffer } = req.file;
        const result = await uploadFile(originalname, mimetype, buffer);
        res.redirect('/google-drive/files');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/files/:fileId/delete', async (req, res) => {
    try {
        await deleteFile(req.params.fileId);
        res.redirect('/google-drive/files');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

router.post('/files/:fileId/rename', async (req, res) => {
    const { newName } = req.body;
    try {
        await renameFile(req.params.fileId, newName);
        res.redirect('/google-drive/files');
    } catch (error) {
        res.status(500).send(error.toString());
    }
});


module.exports = router;
