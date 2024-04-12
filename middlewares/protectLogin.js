const jwt = require('jsonwebtoken')
const { SECRET_KEY, COOKIE_TOKEN_KEY } = require('../config.json')
const userModel = require('../schemas/user')

module.exports = () =>
    /**
     *
     * @param {import("express").Request} req Request
     * @param {import("express").Response} res Response
     * @param {import("express").NextFunction} next Next callback
     */
    async function (req, res, next) {
        function throwError() {
            res.status(401).send({
                success: false,
                message: 'Vui long dang nhap!',
            })
        }
        let token = ''

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1]
        } else {
            token = req.cookies[COOKIE_TOKEN_KEY]
        }

        if (!token) {
            return throwError()
        }

        const info = jwt.verify(token, SECRET_KEY)
        if (!info) {
            return throwError()
        }

        // console.log(info)
        if (info.exp * 1000 < Date.now()) {
            return throwError()
        }

        const item = await userModel.findById(info.id).select('+email').exec()
        if (!item) {
            return throwError()
        }

        req.user = item

        next()
    }
