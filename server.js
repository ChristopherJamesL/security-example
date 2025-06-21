const fs = require('fs');
const https = require('https');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');

require('dotenv').config();

const PORT = 3000;
const app = express();

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
};

const AUTH_OPTIONS = {
    callbackURL: 'auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google Profile: ', profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
};

const server = https.createServer(options, app);

app.use(helmet());
app.use(passport.initialize());

function checkLoggedIn(req, res, next) {
    const isLoggedIn = true; // TODO
    if (!isLoggedIn) {
        return res.status(401).json({
            error: 'You must log in!',
        })
    }
    next();
} 

app.get('/auth/google', (req, res) => {});

app.get('/auth/google/callback', (req, res) => {});

app.get('/auth/logout', (req, res) => {});

app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send(`Your personal secret value is 42`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});