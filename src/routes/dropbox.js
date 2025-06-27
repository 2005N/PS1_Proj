const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const router = express.Router();
const {
  generatePKCECodes,
  getAuthUrl,
  authenticate,
  listFiles,
  downloadFile,
  uploadFile,
  deleteFile
} = require('../connectors/dropbox');

let pkceVerifier = null;

router.get('/auth', (req, res) => {
  const { pkceVerifier: verifier, pkceChallenge } = generatePKCECodes();
  pkceVerifier = verifier;
  const url = getAuthUrl(pkceChallenge);
  res.redirect(url);
});

router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokens = await authenticate(code, pkceVerifier);
    res.render('dropbox/oauth2callback', { token: tokens.access_token });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

router.get('/files', async (req, res) => {
  const accessToken = req.query.token;
  try {
    const files = await listFiles(accessToken);
    res.render('dropbox/files', { files, token: accessToken });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

router.get('/download', async (req, res) => {
  const accessToken = req.query.token;
  const filePath = req.query.path;
  const destination = req.query.destination;

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