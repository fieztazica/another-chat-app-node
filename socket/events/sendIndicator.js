const EventNames = require('../eventNames')

/**
 * Inject props to listener
 * @param {import("socket.io").Socket} socket
 * @param  {...any} props
 * @returns listener
 */
const listener = (socket, ...props) => {
    return async function (data, ack) {
        if (!socket.indicators[socket.room.roomId])
            socket.indicators[socket.room.roomId] = []

        if (
            !socket.indicators[socket.room.roomId].some(
                (s) => s.username == socket.user.username
            )
        ) {
            const timeout = setTimeout(() => {
                socket.indicators[socket.room.roomId] = socket.indicators[
                    socket.room.roomId
                ].filter((s) => s.username != socket.user.username)
                socket.sendAll(
                    EventNames.Indicator,
                    socket.indicators[socket.room.roomId].map((s) => s.username)
                )
            }, 5000)

            socket.indicators[socket.room.roomId].push({
                username: socket.user.username,
                timeout: timeout,
            })
        } else {
            const indicator = socket.indicators[socket.room.roomId].find(
                (s) => s.username == socket.user.username
            )
            indicator.timeout.refresh()
        }
        socket.sendAll(
            EventNames.Indicator,
            socket.indicators[socket.room.roomId].map((s) => s.username)
        )
    }
}

module.exports = listener
