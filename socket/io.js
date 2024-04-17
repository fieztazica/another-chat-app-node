const { Server } = require('socket.io')
const { ROOM_ID_LENGTH } = require('../config.json')
const authenticate = require('./middlewares/auth')
const EventNames = require('./eventNames')
const prehandle = require('./middlewares/prehandle')
const roomModel = require('../schemas/room')
const messageModel = require('../schemas/message')

const io = new Server({
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

const roomRegExp = new RegExp(`^/rooms/([a-z]|[0-9]){${ROOM_ID_LENGTH}}$`, 'gi')

io.of(roomRegExp)
    .use(authenticate())
    .use(prehandle())
    .on('connection', async function (socket) {
        const room = await roomModel
            .findOne({
                isDeleted: false,
                roomId: socket.reqRoomId,
            })
            .populate('owner members', '+email')
            .exec()

        if (!room) {
            socket.disconnect()
            return
        }

        socket.room = room

        socket.presences.get(socket.reqRoomId).add(socket.user)

        function calPresences(onlines = new Set()) {
            onlines = Array.from(onlines.values())
            const array = room.members.map((m) => ({
                _id: m._id,
                username: m.username,
                online: onlines.some((o) => m._id.equals(o._id)),
                createdAt: m.createdAt,
            }))
            return array
        }

        socket.calPresences = calPresences

        const last100Messages = await messageModel
            .find({
                isDeleted: false,
                room: room,
            })
            .populate('room author')
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(100)
            .lean()
            .exec()

        socket.sendAll(
            EventNames.Presence,
            calPresences(socket.presences.get(socket.reqRoomId))
        )

        socket.emit(EventNames.Connected, {
            room,
            last100Messages: last100Messages.reverse(),
        })

        if (
            !socket.room.members.some((user) =>
                socket.user._id.equals(user._id)
            )
        ) {
            socket.room.members.push(socket.user._id)
            await socket.room.save()

            const helloMessage = {
                content: `${socket.user.username} joined the room!`,
                room: socket.room.roomId,
                updatedAt: new Date(),
            }

            socket.sendAll(EventNames.Messages, helloMessage)
        }
        
        require('./events/registerEvents')(socket)
    })

module.exports = io
