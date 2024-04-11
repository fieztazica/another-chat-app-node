const mongoose = require('mongoose')

const messageSchema = mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'room',
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

const MessageModel = new mongoose.model('message', messageSchema)

module.exports = MessageModel
