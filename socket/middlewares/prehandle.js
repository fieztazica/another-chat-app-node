// * Init global variables
let indicators = {}
let presences = new Map()

/**
 *
 * @param  {...any} props
 * @returns
 */
const prehandle = (...props) => {
    /**
     *
     * @param {import("socket.io").Socket} socket
     * @param {*} next
     */
    return async function (socket, next) {
        /**
         * Emit to all clients
         * @param {*} eventName
         * @param  {...any} args
         */
        socket.sendAll = function (eventName, ...args) {
            socket.emit(eventName, ...args)
            socket.broadcast.emit(eventName, ...args)
        }

        socket.indicators = indicators
        socket.presences = presences

        socket.reqRoomId = socket.nsp.name.split('/').pop()

        if (!socket.reqRoomId) {
            socket.disconnect()
            next(new Error('No Room ID provided'))
            return
        }

        if (!socket.presences.has(socket.reqRoomId)) {
            socket.presences.set(socket.reqRoomId, new Set())
        }

        next()
    }
}

module.exports = prehandle
