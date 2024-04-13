const express = require('express')
const { compare } = require('bcrypt')
const { SECRET_KEY, COOKIE_TOKEN_KEY, SITE_URL } = require('../config.json')
const userModel = require('../schemas/user')
const jwt = require('jsonwebtoken')
const userValidator = require('../validators/isUserValid')
const sendMail = require('../helpers/sendMail')
const resHandle = require('../helpers/resHandle')
const strongPassword = require('../validators/isStrongPassword')
const validationChecker = require('../middlewares/validationChecker')
const isEmail = require('../validators/isEmail')
const protectLogin = require('../middlewares/protectLogin')
const isStrongPassword = require('../validators/isStrongPassword')
const router = express.Router()
require("express-async-errors")

router.post(
    '/register',
    validationChecker(userValidator()),
    async function (req, res, next) {
        try {
            const item = new userModel(req.body)
            item.role = req.body.role || ['USER']
            await item.save()
            const { token } = genJwt({ content: { id: item._id }, res })
            resHandle({
                res,
                data: {
                    token,
                    item,
                },
            })
        } catch (error) {
            console.error(error)
            resHandle({ res, status: false, data: error.message })
        }
    }
)

router.post('/login', async function (req, res, next) {
    try {
        const username = req.body.username
        const password = req.body.password
        const rememberMe = req.body.rememberMe
        if (!username || !password) {
            return resHandle({
                res,
                status: false,
                data: 'Username or password incorrect',
            })
        }
        const item = await userModel
            .findOne({ username })
            .select('+password')
            .exec()
        if (!item) {
            return resHandle({
                res,
                status: false,
                data: 'Username or password incorrect',
            })
        }

        const result = await compare(password, item.password)
        if (!result) {
            return resHandle({
                res,
                status: false,
                data: 'Username or password incorrect',
            })
        }

        const { expireDuration, token } = genJwt({
            content: { id: item._id },
            rememberMe: !!rememberMe,
            res,
        })

        resHandle({
            res,
            data: token,
        })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

router.post(
    '/forgot-password',
    validationChecker(isEmail()),
    async function (req, res, next) {
        try {
            const email = req.body.email

            if (!email) {
                res.status(400).send({
                    success: false,
                    message: 'Missing email!',
                })
                return
            }

            let user = await userModel
                .findOne({ email })
                .select('+email')
                .exec()

            if (!user) {
                return resHandle({
                    res,
                    status: false,
                    data: 'Email khong ton tai!',
                    statusCode: 404,
                })
            }

            const token = user.genTokenResetPassword()
            console.log(user.tokenResetPassword)
            await user.save()

            let url = `http://${SITE_URL}/auth/password-reset/${token}`

            await sendMail(`Your password reset link: ${url}`, user.email)

            resHandle({ res })
        } catch (error) {
            console.error(error)
            resHandle({ res, status: false, data: error.message })
        }
    }
)

router.post(
    '/password-reset/:token',
    validationChecker(strongPassword()),
    async function (req, res, next) {
        try {
            let user = await userModel
                .findOne({
                    tokenResetPassword: req.params.token,
                })
                .select('+tokenResetPassword +tokenResetPasswordExp')
                .exec()

            if (!user) {
                resHandle({ res, data: 'URL khong hop le' })
                return
            }

            if (new Date(user.tokenResetPasswordExp).getTime() > Date.now()) {
                user.password = req.body.password
                user.tokenResetPasswordExp = undefined
                user.tokenResetPassword = undefined
                await user.save()
                resHandle({
                    res,
                    status: true,
                    data: 'Doi mat khau thanh cong',
                })
            } else {
                resHandle({ res, status: false, data: 'URL khong hop le' })
                return
            }
        } catch (error) {
            console.error(error)

            resHandle({ res, status: false, data: error.message })
        }
    }
)

router.post(
    '/change-password',
    protectLogin(),
    validationChecker(
        isStrongPassword(['password', 'newPassword', 'confirmNewPassword'])
    ),
    async function (req, res, next) {
        try {
            const password = req.body.password
            const newPassword = req.body.newPassword
            const confirmNewPassword = req.body.confirmNewPassword
            if (newPassword != confirmNewPassword) {
                return resHandle({
                    res,
                    status: false,
                    data: 'Mat khau moi khong trung nhau',
                })
            }

            const result = await compare(password, req.user.password)
            if (!result) {
                return resHandle({
                    res,
                    status: false,
                    data: 'Username or password incorrect',
                })
            }

            req.user.password = newPassword
            await req.user.save()

            resHandle({ res, data: req.user })
        } catch (error) {
            console.error(error)
            resHandle({ res, status: false, data: error.message })
        }
    }
)

router.post('/logout', async function (req, res, next) {
    try {
        res.clearCookie(COOKIE_TOKEN_KEY)
        resHandle({ res })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

module.exports = router

function genJwt({ content, rememberMe = false, res }) {
    let expireDuration = (!!rememberMe ? 30 * 24 : 1) * 3600 * 1000
    const token = jwt.sign(
        {
            ...content,
        },
        SECRET_KEY,
        {
            expiresIn: expireDuration / 1000,
        }
    )

    if (res) {
        res.cookie(COOKIE_TOKEN_KEY, token, {
            expires: new Date(Date.now() + expireDuration),
            httpOnly: true,
        })
    }

    return {
        token,
        expireDuration,
    }
}
