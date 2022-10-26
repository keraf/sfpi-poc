const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 8000;

app.use(cors({
    origin: '*',
}));

app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.get('/', (req, res) => {
    // Request token from API and render it with the page
    axios.get('http://localhost:3000/requestToken')
        .then(({ data: token }) => {
            res.render('index', {
                token,
            });
        })
        .catch(err => {
            console.error(err);
            res.status(500).send('Error');
        });
});

app.listen(port, () => {
    console.log(`App 2 listening on port ${port}`);
});
