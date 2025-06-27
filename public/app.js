document.getElementById('google-login').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/google-drive/auth';
});

document.getElementById('dropbox-login').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/dropbox/auth';
});

document.getElementById('evernote-login').addEventListener('click', () => {
    window.location.href = 'http://localhost:3000/evernote/auth';
});

