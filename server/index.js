const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const port = 2000
const session = require('express-session')
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

const mongoose = require('./config')
const morgan = require('morgan')

const userRoute = require('./user/routes')

app.set('view engine', 'ejs')
// app.use(cookieParser());

app.use(session({
  secret: 'user_id',
  resave: true,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000
  }
}))
app.use(flash());
app.use(function (req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
app.use(function (req, res, next) {
  let hour = 3600000
  req.session.cookie.expires = new Date(Date.now() + hour)
  req.session.cookie.maxAge = 100 * hour;
  next()
})

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))
app.use(express.static('./public'))

app.use(morgan('dev'))
app.use('/', userRoute)

app.listen(port)
console.log('Listening On Port: ' + port)