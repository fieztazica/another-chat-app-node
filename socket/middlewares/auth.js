const cookieExtractor = require('../../helpers/cookies')
const { verifyToken } = require('../../helpers/jwt')
const userModel = require('../../schemas/user')

const authenticate = () =>
    async function (socket, next) {
        if (!socket.handshake?.headers?.cookie) return
        const cookies = cookieExtractor(socket.handshake.headers.cookie)
        const token = cookies['TOKEN']
        if (!token) {
            next(new Error('No token provided'))
            return
        }

        const info = verifyToken(token)
        if (!info) {
            next(new Error('Token invalid'))
            return
        }

        if (info.exp * 1000 < Date.now()) {
            next(new Error('Token expired'))
            return
        }

        const item = await userModel.findById(info.id).select('+email')
        if (!item) {
            next(new Error('User not found'))
            return
        }

        socket.user = item

        next()
    }

module.exports = authenticate
