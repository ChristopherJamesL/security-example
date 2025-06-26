const fs = require('fs');
const https = require('https');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const passport = require('passport');
const { Strategy } = require('passport-google-oauth20');
const cookieSession = require('cookie-session');

require('dotenv').config();

const PORT = 3000;
const app = express();

const config = {
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    COOKIE_KEY_1: process.env.COOKIE_KEY_1,
    COOKIE_KEY_2: process.env.COOKIE_KEY_2,
};

const AUTH_OPTIONS = {
    callbackURL: 'https://localhost:3000/auth/google/callback',
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
};

function verifyCallback(accessToken, refreshToken, profile, done) {
    console.log('Google Profile: ', profile);
    done(null, profile);
}

passport.use(new Strategy(AUTH_OPTIONS, verifyCallback));

// Save session to cookie
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Read session from cookie
passport.deserializeUser((id, done) => {
    done(null, id);
});

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
};

const server = https.createServer(options, app);

app.use(helmet());

app.use(cookieSession({
    name: 'session',
    maxAge: 24 * 60 * 60 * 1000,
    keys: [ config.COOKIE_KEY_1, config.COOKIE_KEY_2 ],
}));
app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
        req.session.regenerate = (cb) => {
            cb();
        };
    }
    if (req.session && !req.session.save) {
        req.session.save = (cb) => {
            cb();
        };
    }
    next();
});
app.use(passport.initialize());
app.use(passport.session());

function checkLoggedIn(req, res, next) {
    console.log('current user: ', req.user); // req.isAuthenticated() &&
    const isLoggedIn =  req.user;
    if (!isLoggedIn) {
        return res.status(401).json({
            error: 'You must log in!',
        })
    }
    next();
} 

app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['email'],
    })
);

app.get('/auth/google/callback', 
    passport.authenticate('google', {
        failureRedirect: '/failure',
        successRedirect: '/',
        session: true,
    }), 
    (req, res) => {
        console.log('Google called us back!');
    }
);

app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get('/secret', checkLoggedIn, (req, res) => {
    return res.send(`Your personal secret value is 42`);
});

app.get('/failure', (req, res) => {
    return res.send('Failed to login');
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});