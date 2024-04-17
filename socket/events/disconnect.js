const EventNames = require('../eventNames')

/**
 * Inject props for listener
 * @param {import("socket.io").Socket} socket
 * @param  {...any} props
 * @returns listener
 */
const listener = (socket, ...props) =>
    async function (reason) {
        socket.presences
            .get(socket.room.roomId)
            .forEach((v) =>
                socket.user._id.equals(v._id)
                    ? socket.presences.get(socket.room.roomId).delete(v)
                    : v
            )
        socket.sendAll(
            EventNames.Presence,
            socket.calPresences(socket.presences.get(socket.room.roomId))
        )
    }

module.exports = listener
