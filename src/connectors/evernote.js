const Evernote = require('evernote');

const getClient = (accessToken = null) => {
  const config = {
    consumerKey: process.env.EVERNOTE_CONSUMER_KEY,
    consumerSecret: process.env.EVERNOTE_CONSUMER_SECRET,
    sandbox: false, // Ensure sandbox is set to false
    china: false,
    serviceHost: 'www.evernote.com'
  };
  
  if (accessToken) {
    config.token = accessToken;
  }

  return new Evernote.Client(config);
};

const getRequestToken = async (callbackUrl) => {
  const client = getClient();
  return new Promise((resolve, reject) => {
    client.getRequestToken(callbackUrl, (error, oauthToken, oauthTokenSecret, results) => {
      if (error) {
        console.error('Error getting request token:', error);
        return reject(error);
      }
      console.log('Request token obtained:', { oauthToken, oauthTokenSecret });
      resolve({ oauthToken, oauthTokenSecret });
    });
  });
};

const getAccessToken = async (oauthToken, oauthTokenSecret, oauthVerifier) => {
  const client = getClient();
  return new Promise((resolve, reject) => {
    client.getAccessToken(oauthToken, oauthTokenSecret, oauthVerifier, (error, oauthAccessToken, oauthAccessTokenSecret, results) => {
      if (error) {
        console.error('Error getting access token:', error);
        return reject(error);
      }
      console.log('Access token obtained:', { oauthAccessToken, oauthAccessTokenSecret });
      resolve({ oauthAccessToken, oauthAccessTokenSecret });
    });
  });
};

const listNotebooks = async (accessToken) => {
  try {
    const client = getClient(accessToken);
    const noteStore = client.getNoteStore();
    const notebooks = await noteStore.listNotebooks();
    //console.log('Notebooks listed:', notebooks);
    return notebooks;
  } catch (error) {
    console.error('Error listing notebooks:', error);
    throw error;
  }
};

/*
const getNote = async (accessToken, noteGuid) => {
  try {
    console.log('Initializing Evernote Client with token:', accessToken);
    const client = new Evernote.Client({ token: accessToken });
    const noteStore = client.getNoteStore();
    
    console.log('Retrieving note with GUID:', noteGuid);
    
    const resultSpec = new Evernote.NoteStore.NoteResultSpec({
      includeContent: true,
      includeResourcesData: false,
      includeResourcesRecognition: false,
      includeResourcesAlternateData: false,
      includeSharedNotes: false,
      includeNoteAppDataValues: false,
      includeResourceAppDataValues: false,
      includeAccountLimits: false,
    });

    console.log('Using ResultSpec:', resultSpec);
    
    const note = await noteStore.getNoteWithResultSpec(noteGuid, resultSpec);
    console.log('Note obtained:', note);
    return note;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

const listNotesInNotebook = async (accessToken, notebookGuid) => {
  try {
    const client = getClient(accessToken);
    const noteStore = client.getNoteStore();
    const filter = new Evernote.NoteStore.NoteFilter({ notebookGuid });
    const noteList = await noteStore.findNotes(filter, 0, 20); // Adjust startIndex and maxNotes as needed
    return noteList.notes;
  } catch (error) {
    console.error('Error listing notes:', error);
    throw error;
  }
};
*/
module.exports = {
  getRequestToken,
  getAccessToken,
  listNotebooks,
};
