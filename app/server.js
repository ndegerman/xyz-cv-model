'use strict';

var path = require('path');
var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var cors = require('cors');

var profileRoutes = require('./routes/profile.routes')(express.Router());
var officeRoutes = require('./routes/office.routes')(express.Router());

var errorMiddleware = require('./middleware/error.middleware');
var authenticationMiddleware = require('./middleware/authentication.middleware');
var responseMiddleware = require('./middleware/response.middleware');

var config = require('config');

var app = express();

// CONFIG
// ============================================================================
var port = process.env.PORT || config.PORT;

app.set('superSecret', config.SECRET);

// json
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// logging
app.use(morgan('dev'));

// ROUTES & MIDDLEWARE
// ============================================================================
app.options('*', cors({credentials: true, origin: true}));
app.use(cors({credentials: true, origin: true}));

app.use(authenticationMiddleware.authentication);
app.use(responseMiddleware.nocache);

app.use('/profile', profileRoutes);
app.use('/office', officeRoutes);

app.use(errorMiddleware.errorFilter);

// for debugging
app.get('/kalle', function(req, res) {
    res.send('Connecting to: ' + port + '. Your email is: ' + req.headers['x-forwarded-email'] + ' and your account is: ' + req.headers['x-forwarded-user']);
});

var server = app.listen(port, function() {
    console.log('Server started: http://localhost:%s/', server.address().port);
});
