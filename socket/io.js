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
            presences.set(reqRoomId, new Map())
        }

        socket.on(EventNames.Disconnect, (reason) => {
            presences.get(reqRoomId).delete(socket.user._id)
        })

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

        presences.get(reqRoomId).set(socket.user._id, socket.user)

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
            .lean()
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(100)
            .exec()

        socket.sendAll(EventNames.Messages, helloMessage)

        console.log(presences.get(reqRoomId).values())

        socket.sendAll(
            EventNames.Presence,
            Array.from(presences.get(reqRoomId).values())
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
}
