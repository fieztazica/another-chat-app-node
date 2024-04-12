const { Server } = require('socket.io')
const roomModel = require('../schemas/room')
const { ROOM_ID_LENGTH } = require('../config.json')

let rooms = []

const io = new Server({
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

const roomRegExp = new RegExp(`^/rooms/([a-z]|[0-9]){${ROOM_ID_LENGTH}}$`, 'gi')

io.of(roomRegExp).on('connection', async function (socket) {
    const reqRoomId = socket.nsp.name.split('/').pop()
    if (!reqRoomId) {
        socket.disconnect()
        return
    }

    const room = await roomModel
        .findOne({
            isDeleted: false,
            roomId: reqRoomId,
        })
        .populate('owner')
        .exec()

    if (!room) {
        socket.disconnect()
        return
    }

    socket.emit(EventNames.Messages, {
        content: `${room.owner.username} said welcome to ${room.roomId}`,
    })

    socket.emit(EventNames.Connected, room)

    socket.on(EventNames.SendMessage, function (data, ack) {
        const message = {
            content: data,
        }
        socket.emit(EventNames.Messages, message)
        socket.broadcast.emit(EventNames.Messages, message)
    })
})

module.exports = io

const EventNames = {
    SendMessage: 'send_message',
    Messages: 'messages',
    JoinRoom: 'join_room',
    Connected: 'connected',
    Error: 'error',
}
