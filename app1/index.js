const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { attoid } = require('attoid');

const app = express();
const port = 3000;

const users = [{
    username: 'Felix',
    email: 'felix@the.cat',
    password: '123456',
    avatar: 'https://placekitten.com/128/128',
}];

let userTokens = {};

app.use(cors({
    origin: 'null',
    credentials: true,
}));
app.use(cookieParser('s3cr3t'));
app.use(express.urlencoded({ extended: false }));

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

const getUserForToken = (token) => {
    if (!token) {
        return;
    }

    const username = userTokens[token];
    if (username === undefined) {
        return;
    }

    return users.find(u => u.username === username);
};

/**
 * Serves the home page but forbids it from being
 * iframed as there is no token check on there.
 */
app.get('/', (req, res) => {
    res.set({
        'x-frame-options': 'DENY',
    });
    res.render('index');
});

/**
 * Serve the home page which can be embedded as an
 * iframe with the token check.
 */
app.get('/iframe', (req, res) => {
    const { referer } = req.headers;
    const { token } = req.query;

    if (!token) {
        res.status(403).send('Missing token');
        return;
    }

    jwt.verify(token, 's3cr3t', (err, decoded) => {
        if (err) {
            res.status(403).send('Invalid token');
            return;
        }
        
        // Reject if referer of the signed token doesn't
        // match the one sent with the request.
        // This should prevent other pages from embedding
        // the iframe if they manage to get the token.
        if (referer !== decoded.referer) {
            res.status(403).send('Incorrect referer');
            return;
        }

        res.render('index');
    });
});

/**
 * Serve login form for authenticating the user.
 */
app.get('/login', (req, res) => {
    const user = getUserForToken(req.cookies.token);
    if (user !== undefined) {
        return res.redirect('/');
    }

    res.render('login');
});

/**
 * Process the login form submission.
 */
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => 
        u.email === email && 
        u.password === password);

    if (!user) {
        return res.render('login', {
            error: 'Invalid credentials.',
        });
    }

    const token = attoid();
    userTokens[token] = user.username;

    res.cookie('token', token, {
        maxAge: 600000,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
    });
    res.redirect('/');
});

/**
 * Process logout request for the user.
 */
app.get('/logout', (req, res) => {
    const { token } = req.cookies;

    if (token) {
        delete userTokens[token];
        res.clearCookie('token');
    }

    res.redirect('/');
});

/**
 * Get the currently logged user infos (based on 
 * cookie).
 * This is used for an example API call from the
 * page.
 */
app.get('/getUserInfo', (req, res) => {
    const user = getUserForToken(req.cookies.token);
    if (user === undefined) {
        return res.status(403).send();
    }

    res.send(user);
});

/**
 * This should only be called by internal services.
 * For the purpose of this PoC, no checks are done
 * here.
 */
app.get('/requestToken', (req, res) => {    
    const token = jwt.sign(
        {
            // Referer should be based somehow on the
            // requester, either by fetching it from
            // some database entry or via a parameter
            // or header passed to this endpoint.
            referer: 'http://localhost:8000/',
        }, 
        's3cr3t',
        {
            // Expiration is purposely short to avoid
            // the token being re-used. 30 seconds
            // should leave enough time for the iframe
            // to verify the token.
            expiresIn: '30s',
        }
    );

    res.send(token);
});

app.listen(port, () => {
    console.log(`App 1 listening on port ${port}`);
});
