// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var app      = express();
var port     = process.env.PORT || 3000;
var path	 = require('path');

var passport = require('passport');
var flash    = require('connect-flash');
const { verify } = require('./config/verify');

// add static file assets
app.use(express.static(path.resolve(__dirname, 'public')));

// configuration ===============================================================
// connect to our database



// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(express.urlencoded({extended: false})); //urlencoding
app.use(express.json()); // json reader

app.set('view engine', 'ejs'); // set up ejs for templating



// required for passport
app.use(session({
	secret: 'sessionOn',
	resave: true,
	saveUninitialized: true
} )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// auth
require('./config/passport')(passport); // pass passport for configuration
// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
