var express = require('express')
var router = express.Router()

router.use('/books', require('./books'))
router.use('/users', require('./users'))
router.use('/auth', require('./auth'))
router.use('/authors', require('./authors'))
router.use('/rooms', require('./rooms'))
router.use('/messages', require('./rooms'))

module.exports = router
