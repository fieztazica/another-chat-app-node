const { check } = require('express-validator')
const { options, messages } = require('./config')

/**
 *
 * @param {string | string[]} fieldName
 * @returns
 */
module.exports = function (fieldName = 'password') {
    return check(fieldName, messages.errors.PASSWORD).isStrongPassword(
        options.PASSWORD
    )
}
