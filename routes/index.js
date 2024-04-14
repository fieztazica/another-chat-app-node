var express = require('express')
var router = express.Router()

router.use('/users', require('./users'))
router.use('/auth', require('./auth'))
router.use('/rooms', require('./rooms'))

module.exports = router
