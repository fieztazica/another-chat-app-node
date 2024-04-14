const { Server } = require('socket.io')
const userModel = require('../schemas/user')
const roomModel = require('../schemas/room')
const messageModel = require('../schemas/message')
const { ROOM_ID_LENGTH, SECRET_KEY } = require('../config.json')
const authenticate = require('./auth')

let rooms = []
let indicators = {}
let presences = new Map()

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
    .on('connection', async function (socket) {
        socket.sendAll = function (eventName, ...args) {
            socket.emit(eventName, ...args)
            socket.broadcast.emit(eventName, ...args)
        }

        const reqRoomId = socket.nsp.name.split('/').pop()

        if (!reqRoomId) {
            socket.disconnect()
            return
        }

        if (!presences.has(reqRoomId)) {
            presences.set(reqRoomId, new Set())
        }

        const room = await roomModel
            .findOne({
                isDeleted: false,
                roomId: reqRoomId,
            })
            .populate('owner members')
            .exec()

        if (!room) {
            socket.disconnect()
            return
        }

        socket.once(EventNames.Disconnect, (reason) => {
            presences
                .get(reqRoomId)
                .forEach((v) =>
                    v._id == socket.user._id
                        ? presences.get(reqRoomId).delete(v)
                        : v
                )
            socket.sendAll(
                EventNames.Presence,
                calPresences(presences.get(reqRoomId))
            )
        })

        function calPresences(onlines = new Set()) {
            onlines = Array.from(onlines.values())
            const array = room.members.map((m) => ({
                _id: m._id,
                username: m.username,
                online: onlines.some(
                    (o) => o._id == m._id || o.username == m.username
                ),
            }))
            return array
        }

        if (
            !room.members.some(
                (m) =>
                    m._id == socket.user._id ||
                    m.username == socket.user.username ||
                    m.email == socket.user.email
            )
        ) {
            room.members.push(socket.user._id)
            await room.save()
            // console.log(room.members)
        }

        presences.get(reqRoomId).add(socket.user)

        const helloMessage = {
            content: `${socket.user.username} joined the room!`,
            room: room.roomId,
            updatedAt: new Date(),
        }

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

        socket.sendAll(EventNames.Messages, helloMessage)

        socket.sendAll(
            EventNames.Presence,
            calPresences(presences.get(reqRoomId))
        )

        socket.emit(EventNames.Connected, {
            room,
            last100Messages: last100Messages.reverse(),
        })

        socket.on(EventNames.SendMessage, async function (data, ack) {
            const message = new messageModel({
                content: data,
                room: room,
                author: socket.user,
            })
            await message.save()
            socket.sendAll(EventNames.Messages, message)
        })

        socket.on(EventNames.SendIndicator, async function (data, ack) {
            if (!indicators[reqRoomId]) indicators[reqRoomId] = []

            if (
                !indicators[reqRoomId].some(
                    (s) => s.username == socket.user.username
                )
            ) {
                const timeout = setTimeout(() => {
                    indicators[reqRoomId] = indicators[reqRoomId].filter(
                        (s) => s.username != socket.user.username
                    )
                    socket.sendAll(
                        EventNames.Indicator,
                        indicators[reqRoomId].map((s) => s.username)
                    )
                }, 5000)

                indicators[reqRoomId].push({
                    username: socket.user.username,
                    timeout: timeout,
                })
            } else {
                const indicator = [reqRoomId].find(
                    (s) => s.username == socket.user.username
                )
                indicator.timeout.refresh()
            }
            socket.sendAll(
                EventNames.Indicator,
                indicators[reqRoomId].map((s) => s.username)
            )
        })
    })

module.exports = io

const EventNames = {
    SendMessage: 'send_message',
    Messages: 'messages',
    JoinRoom: 'join_room',
    Connected: 'connected',
    Error: 'error',
    SendIndicator: 'send_indicator',
    Indicator: 'indicator',
    Presence: 'presence',
    Disconnect: 'disconnect',
    Disconnecting: 'disconnecting',
}
