const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
require('dotenv').config();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const googleDriveRoutes = require('./src/routes/googleDrive');
const dropboxRoutes = require('./src/routes/dropbox');
const evernoteRoutes = require('./src/routes/evernote');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/google-drive', googleDriveRoutes);
app.use('/dropbox', dropboxRoutes);
app.use('/evernote', evernoteRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
