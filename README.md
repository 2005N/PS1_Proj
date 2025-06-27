# File Manager Web App

A Node.js + Express web application that allows users to securely manage their files across Google Drive and Dropbox, including listing, uploading, downloading, and deleting files—all from one interface.

##  Features

-  OAuth 2.0 authentication 
-  List files in your Google Drive or Dropbox account
-  Upload files to your cloud storage
-  Download files from your cloud
-  Delete files directly from the UI

##  Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** EJS templates, HTML, CSS
- **Authentication:** OAuth 2.0
- **Cloud APIs:** Google Drive API, Dropbox SDK


### Prerequisites

- Node.js & npm
- Dropbox and Google Cloud developer accounts (to get client IDs/secrets)

### Clone the repository

```bash
git clone https://github.com/2005N/PS1_Proj.git
cd PS1_Proj
npm install
```

### Set up Environment Variables
Create a .env file in the root directory with the following:
```bash
DROPBOX_CLIENT_ID=your_dropbox_client_id
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/google-drive/oauth2callback
DROPBOX_REDIRECT_URI=http://localhost:3000/dropbox/oauth2callback
```

### Run the application  
```bash 
npm run dev
```
The app will be running at: http://localhost:3000
