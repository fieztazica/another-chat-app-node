const { check } = require('express-validator')
const util = require('util')
const { options, messages } = require('./config')
const isStrongPassword = require('./isStrongPassword')
const isEmail = require('./isEmail')

module.exports = function () {
    return [
        check('username').isLength(options.USERNAME.length),
        isEmail(),
        isStrongPassword(),
        check('role').default(['USER']).isIn(options.ROLES.enums).optional(),
    ]
}
