// Load the .env config
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');

const path = require('path');
const app = express();

const parentDir = path.join(__dirname, '../')

// Setup the handlebars view engine
app.set('views', path.join(parentDir, 'resources/views'));
app.set('view engine', 'hbs');
if (process.env.REQUEST_LOGGING === 'true') {
    app.use(logger('dev'));
}
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.urlencoded({extended: false}));
app.use(express.static(path.join(parentDir, 'public'))); // Serving the public directory

app.use((req, res, next) => {
    if (req.destination === 'document') {
        res.header('Content-Security-Policy', "default-src 'self'"); // Better alternative to the meta tag (IE compat)
        res.header('X-Content-Security-Policy', "default-src 'self'"); // Better alternative to the meta tag (IE compat)
        res.header('X-UA-Compatible', 'ie=edge'); // Better alternative to the meta tag (IE compat)
    }
    next(); // Continue to the next request
})

// Browser support mime types (fonts and svg charset)
express.static.mime.define({'font/woff2': ['woff2']});
express.static.mime.define({'image/svg+xml; charset=utf-8': ['svg']});

// Load the database
const database = require('./database')

// Initialize the router
require('./router.js')(app, database)

module.exports = app;
