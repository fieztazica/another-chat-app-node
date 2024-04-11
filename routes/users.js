const express = require('express')
const { check, body, validationResult } = require('express-validator')
const userModel = require('../schemas/user')
const userValidator = require('../validators/isUserValid')
const protectLogin = require('../middlewares/protectLogin')
const protectRole = require('../middlewares/protectRole')
const resHandle = require('../helpers/resHandle')
const router = express.Router()

/* GET */
router.get(
    '/',
    protectLogin(),
    protectRole('ADMIN', 'MODERATOR'),
    async function (req, res, next) {
        const limit = req.query.limit || 1
        const page = req.query.page || 1

        let sort = {}

        if (req.query.sort) {
            if (req.query.sort.startsWith('-')) {
                sort[req.query.sort.substring(1, req.query.sort.length)] = -1
            } else {
                sort[req.query.sort] = 1
            }
        }

        const contain = Object.fromEntries(
            Object.keys(req.query)
                .filter((v) => !['limit', 'page', 'sort'].includes(v))
                .map((key) => {
                    let value = req.query[`${key}`]
                    if (typeof req.query[key] === 'string') {
                        value = value?.replace(',', '|') || value
                        value = new RegExp(value, 'i')
                    }
                    return [key, value]
                })
        )

        // console.log(contain)
        const items = await userModel
            .find({
                isDeleted: false,
                ...contain,
            })
            // .populate('published')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort(sort)
            .exec()
        resHandle({ res, data: items.filter((v) => !v.isDeleted) })
    }
)

/* GET /id*/
router.get('/@me', protectLogin(), async function (req, res, next) {
    try {
        resHandle({ res, data: req.user })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* GET /id*/
router.get('/:id', async function (req, res, next) {
    try {
        const item = await userModel
            .find({
                _id: decodeURIComponent(req.params.id),
                isDeleted: false,
            })
            .exec()
        resHandle({ res, data: item })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* POST */
router.post('/', userValidator(), async function (req, res, next) {
    const result = validationResult(req)
    if (result.errors.length > 0) {
        return resHandle({ res, status: false, data: result.errors })
    }
    try {
        const item = new userModel(req.body)
        await item.save()
        res.send(item)
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* PUT */
router.put('/:id', async function (req, res, next) {
    try {
        const item = await userModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        )

        resHandle({ res, data: item })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* DELETE */
router.delete('/:id', async function (req, res, next) {
    try {
        const item = await userModel.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
            },
            {
                new: true,
            }
        )
        resHandle({ res, data: item })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

module.exports = router
