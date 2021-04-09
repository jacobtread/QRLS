require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');
const logger = require('morgan');


const app = express();
const database = require('./database')

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


require('./router.js')(app, database)

module.exports = app;
