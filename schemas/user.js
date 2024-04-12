const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('crypto')

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        status: {
            type: Boolean,
            required: true,
            default: true,
        },
        role: {
            type: [String],
            required: true,
            default: ['USER'],
        },

        tokenResetPassword: {
            type: String,
            select: false,
        },

        tokenResetPasswordExp: {
            type: String,
            select: false,
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

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
    }
})

userSchema.methods.genTokenResetPassword = function () {
    this.tokenResetPassword = crypto.randomBytes(30).toString('hex')
    this.tokenResetPasswordExp = Date.now() + 10 * 60 * 1000

    return this.tokenResetPassword
}

const UserModel = new mongoose.model('user', userSchema)

module.exports = UserModel
