const express = require('express');
const router = express.Router();
const { getRequestToken, getAccessToken, listNotebooks, listNotesInNotebook } = require('../connectors/evernote');

let oauthTokenSecret = '';
let oauthAccessToken = '';  // Store the access token

router.get('/auth', async (req, res) => {
  const callbackUrl = process.env.EVERNOTE_CALLBACK_URL;
  try {
    const { oauthToken, oauthTokenSecret: secret } = await getRequestToken(callbackUrl);
    oauthTokenSecret = secret;
    const authorizationUrl = `https://www.evernote.com/OAuth.action?oauth_token=${oauthToken}`;
    res.redirect(authorizationUrl);
  } catch (error) {
    console.error('Error in /auth:', error);
    res.status(500).send(error.toString());
  }
});

router.get('/oauth_callback', async (req, res) => {
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  try {
    const { oauthAccessToken: accessToken } = await getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier);
    oauthAccessToken = accessToken;  // Store the access token
    console.log('Obtained oauthAccessToken:', accessToken);
    //res.json({ accessToken: accessToken });
     res.send(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document Integrator</title>
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                <a href="/evernote/notebooks">List files</a>
            </body>
            </html>`)
  } catch (error) {
    console.error('Error in /oauth_callback:', error);
    res.status(500).send(error.toString());
  }
});

router.get('/notebooks', async (req, res) => {
  const accessToken = req.query.token || oauthAccessToken;  // Use the stored access token
  try {
    const notebooks = await listNotebooks(accessToken);
    //res.json(notebooks);
    const filesJson = JSON.stringify(notebooks);
        //res.sendFile(path.join(__dirname, 'public', 'files.html'));
        res.send(` <!DOCTYPE html>
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
                    // Function to display files
                    function displayFiles(files) {
                        const fileList = document.getElementById('file-list');
                        fileList.innerHTML = '';
                        files.forEach(file => {
                            const fileItem = document.createElement('div');
                            fileItem.textContent = file.name;
                            fileList.appendChild(fileItem);
                        });
                    }

                    displayFiles(files);
                </script>
            </body>
            </html>`)
  } catch (error) {
    console.error('Error in /notebooks:', error);
    res.status(500).send(error.toString());
  }
});

/*
router.get('/note', async (req, res) => {
    const accessToken = req.query.token;
    const noteGuid = req.query.guid;
    
    try {
      console.log('Retrieving note for token:', accessToken, 'and GUID:', noteGuid);
      const note = await getNote(accessToken, noteGuid);
      res.json(note);
    } catch (error) {
      console.error('Error in /note:', error);
      res.status(500).send(error.toString());
    }
  });
  
router.get('/notebooks/:notebookGuid', async (req, res) => {
    const accessToken = req.query.token || oauthAccessToken;  // Use the stored access token
    const notebookGuid = req.params.notebookGuid;
    try {
      const notes = await listNotesInNotebook(accessToken, notebookGuid);
      const notesJson = JSON.stringify(notes);
      res.send(`<!DOCTYPE html>
              <html lang="en">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Document Integrator</title>
                  <link rel="stylesheet" href="styles.css">
              </head>
              <body>
                  <div id="note-list"></div>
                  <script>
                      const notes = ${notesJson};
                      function displayNotes(notes) {
                          const noteList = document.getElementById('note-list');
                          noteList.innerHTML = '';
                          notes.forEach(note => {
                              const noteItem = document.createElement('div');
                              noteItem.textContent = note.title;
                              noteList.appendChild(noteItem);
                          });
                      }
                      displayNotes(notes);
                  </script>
              </body>
              </html>`);
    } catch (error) {
      console.error('Error in /notebooks/:notebookGuid:', error);
      res.status(500).send(error.toString());
    }
});
*/

module.exports = router;
