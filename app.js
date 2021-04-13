// Load the .env config
require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const logger = require('morgan');

const path = require('path');
const app = express();

// Setup the handlebars view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'))
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Load the database
const database = require('./database')

// Initialize the router
require('./router.js')(app, database)

module.exports = app;
