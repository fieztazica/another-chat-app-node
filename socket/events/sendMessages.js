const messageModel = require('../../schemas/message')
const EventNames = require('../eventNames')

/**
 * Inject props to listener
 * @param {import("socket.io").Socket} socket
 * @param  {...any} props
 * @returns listener
 */
const listener = (socket, ...props) => {
    const { room, user } = socket
    return async function (data, ack) {
        const message = new messageModel({
            content: data,
            room: room,
            author: user,
        })

        socket.sendAll(EventNames.Messages, message)
        await message.save()
    }
}

module.exports = listener
