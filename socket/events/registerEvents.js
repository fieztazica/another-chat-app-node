const EventNames = require('../eventNames')

const registerEvents = (socket, ...props) => {
    socket.once(
        EventNames.Disconnect,
        require('./disconnect')(socket)
    )

    socket.on(
        EventNames.SendMessage,
        require('./sendMessages')(socket)
    )

    socket.on(
        EventNames.SendIndicator,
        require('./sendIndicator')(socket)
    )
}

module.exports = registerEvents
