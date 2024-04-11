var createError = require('http-errors')
var express = require('express')
var path = require('path')
var cookieParser = require('cookie-parser')
var logger = require('morgan')
var mongoose = require('mongoose')
const { DATABASE_CONNECTION_URL } = require('./config.json')

var indexRouter = require('./routes/index')
var usersRouter = require('./routes/users')
var authRouter = require('./routes/auth')
var booksRouter = require('./routes/books')
var authorsRouter = require('./routes/authors')

var app = express()

mongoose
    .connect(DATABASE_CONNECTION_URL)
    .then(() => {
        console.log('MongoDB Connected')
    })
    .catch((e) => {
        console.error(e)
    })

// // view engine setup
// app.set('views', path.join(__dirname, 'views'))
// app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/users', usersRouter)
app.use('/auth', authRouter)
app.use('/books', booksRouter)
app.use('/authors', authorsRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'development' ? err : {}

    // render the error page
    res.status(err.status || 500)
    res.send({
        success: false,
        message: err.message || null,
        data: {},
    })
})

module.exports = app
