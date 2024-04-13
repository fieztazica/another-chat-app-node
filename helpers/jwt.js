const jwt = require('jsonwebtoken')
const { SECRET_KEY } = require('../config.json')

const extractToken = (token) => jwt.decode(token)

const verifyToken = (token) => jwt.verify(token, SECRET_KEY)

module.exports = {
    extractToken,
    verifyToken,
}
