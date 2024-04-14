const mongoose = require('mongoose')

const roomSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        roomId: {
            type: String,
            required: true,
            unique: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                index: { unique: true, dropDups: true },
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

roomSchema.virtual('messages', {
    ref: 'message',
    foreignField: 'room',
    localField: '_id',
})

roomSchema.set('toObject', { virtuals: true })
roomSchema.set('toJSON', { virtuals: true })

const RoomModel = new mongoose.model('room', roomSchema)

module.exports = RoomModel
