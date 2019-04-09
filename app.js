// Copyright (c) 2019, Fexra, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
'use strict'

// Set Express App
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const Helmet = require('helmet')
const Compression = require('compression')
const favicon = require('serve-favicon')
const path = require('path')
const flash = require('connect-flash')
const logger = require('morgan')
const validator = require('express-validator')
const passport = require('passport')
const passportStrategy = require('./utils/utils').passport
const speakEasy = require('speakeasy')
const uuid = require('uuid/v1')

// Setup DB if not exist
require('./utils/db/schema')


// Setup Session Store
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)

var storeConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  checkExpirationInterval: 900000,
  expiration: 86400000,
  schema: {
    tableName: 'sessions',
    columnNames: {
      session_id: 'id',
      expires: 'expires',
      data: 'data'
    }
  }
}

const sessionStore = new MySQLStore(storeConfig)

const sessionData = session({
  key: 'express-starter',
  secret: process.env.APP_COOKIE_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  secure: true
})

app.use(sessionData)

app.use(function (req, res, next) {
  res.locals.session = req.session
  return next()
})

// Set Validator
app.use(validator())

// Set Passport
passportStrategy(passport)

app.use(passport.initialize())
app.use(passport.session())

// Compress
app.use(Helmet())
app.use(Compression())

// Set Flash
app.use(flash())

app.use(function (req, res, next) {
  res.locals.message = req.flash()
  return next()
})

// Set Parsers/Path/Favicon/Templates
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

app.use(logger('dev'))

// Set Permissions
const notAuthenticated = {
  flashType: 'error',
  message: 'The entered credentials are incorrect',
  redirect: '/401'
}

const notAuthorized = {
  flashType: 'error',
  message: 'Not Authorized',
  redirect: '/403'
}

app.set('permission', {
  notAuthenticated: notAuthenticated,
  notAuthorized: notAuthorized
})


// Load Middleware
const verifyUser = require('./middleware/verifyUser')


// Routes
const welcome = require('./routes/welcome')
const dashboard = require('./routes/dashboard')
const settings = require('./routes/settings')

app.use('/welcome', welcome)
app.use('/dashboard', verifyUser, dashboard)
app.use('/settings', verifyUser, settings)

// Set Public index
app.get('/', function (req, res) {
  if (req.user) {
    res.redirect('/dashboard')
  } else {
    res.render('public', {
      title: 'TRTL Services',
      user: (req.user) ? req.user : undefined
    })
  }
})

//Set Recaptcha
const verifyRecaptcha = require('./middleware/verifyRecaptcha')

// Set Login Redirects
app.get('/login',
function (req, res) {
  if (req.user) {
    res.redirect('/dashboard')
  } else {
    res.render('login/login', {
      title: 'Login',
      user: (req.user) ? req.user : undefined,
      recaptcha: process.env.RECAPTCHA_SITE_KEY
    })
  }
})

app.post('/login',
verifyRecaptcha,
passport.authenticate('local-login', {
  // successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true

}),
function (req, res, next) {

  if (req.user.verified === 1) {
    req.session.verified = false
    res.redirect('/verify')
  } else {
    req.session.verified = true
    res.redirect('/dashboard')
  }
})

app.get('/verify',function (req, res) {
  if (req.session.verified === false) {
    res.render('login/verify', {
      title: 'Verify',
      user: (req.user) ? req.user : undefined
    })
  } else {
    res.redirect('/')
  }
})

app.post('/verify', function (req, res) {
  let verify = speakEasy.totp.verify({
    secret: req.user.secret,
    encoding: 'base32',
    token: req.body.token
  })

  if (verify) {
    req.session.verified = true
    res.redirect('/dashboard')
  } else {
    req.flash('error', 'You have entered an invalid token.')
    res.redirect('/verify')
  }
})

app.get('/register',
function (req, res) {
  if (req.user) {
    res.redirect('/dashboard')
  } else if (process.env.APP_REGISTRATION == false) {
    res.render('login/register_closed', {
      title: 'Registration Closed'
    })
  } else {
    res.render('login/register', {
      title: 'Register',
      user: (req.user) ? req.user : undefined,
      recovery: uuid(),
      recaptcha: process.env.RECAPTCHA_SITE_KEY
    })
  }
})

app.post('/register',
verifyRecaptcha,
passport.authenticate('local-signup', {
  successRedirect: '/welcome',
  failureRedirect: '/register',
  failureFlash: true
}))

app.get('/logout', function mainHandler (req, res) {
  req.session.destroy()
  req.logout()
  res.redirect('/')
})

app.get('/401', function (req, res) {
  res.render('login/401', {
    title: '401',
    user: (req.user) ? req.user : undefined
  })
})

app.get('/403', function (req, res) {
  res.render('login/403', {
    title: '403',
    user: (req.user) ? req.user : undefined
  })
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.render('login/404', {
    title: '404',
    user: (req.user) ? req.user : undefined
  })
})

// error handler
app.use(function onError (err, req, res, next) {

  console.log(err)

  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = process.env.DEBUG == true ? err : {}
  res.statusCode = err.status || 500

  res.render('login/error', {
    title: 'Error',
    user: (req.user) ? req.user : undefined
  })

})

module.exports = app
