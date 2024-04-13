var express = require('express')
var roomModel = require('../schemas/room')
const resHandle = require('../helpers/resHandle')
const { ROOM_ID_LENGTH } = require('../config.json')
const protectLogin = require('../middlewares/protectLogin')
var router = express.Router()
require('express-async-errors')

router.use(protectLogin())

function genId(length) {
    const source =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let index = 0; index < length; index++) {
        const rand = source[Math.floor(Math.random() * source.length - 1)]
        result += rand
    }
    return result
}

/* GET rooms listing. */
router.get('/', async function (req, res, next) {
    const limit = req.query.limit || 10
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
                const stringArray = ['name']
                const numberArray = []
                let value = req.query[`${key}`]
                if (stringArray.includes(key)) {
                    value = value?.replace(',', '|') || value
                    value = new RegExp(value, 'i')
                }
                if (numberArray.includes(key)) {
                    let string = JSON.stringify(value)
                    let newString = string.replaceAll(
                        /^(?!\$)(lte|lt|gt|gte)$/gi,
                        (res) => '$' + res
                    )
                    value = JSON.parse(string)
                    console.log(string, value, newString)
                }
                return [key, value]
            })
    )

    const rooms = await roomModel
        .find({
            isDeleted: false,
            ...contain,
        })
        .populate('owner')
        .lean()
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sort)
        .exec()

    resHandle({ res, data: rooms.filter((v) => !v.isDeleted) })
})

/* GET room by id. */
router.get('/@mine', async function (req, res, next) {
    try {
        const rooms = await roomModel
            .find({
                isDeleted: false,
                owner: req.user._id,
            })
            .populate('owner')
            .lean()
            .exec()

        resHandle({ res, data: rooms })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* GET room by id. */
router.get('/:id', async function (req, res, next) {
    try {
        const reqId = decodeURIComponent(req.params.id)
        const findQueryKey = reqId.length == ROOM_ID_LENGTH ? 'roomId' : '_id'
        const room = await roomModel
            .findOne({
                [findQueryKey]: reqId,
                isDeleted: false,
            })
            .populate('owner')
            .exec()
        if (!room) {
            resHandle({ res, data: room, status: false, statusCode: 404 })
            return
        }
        resHandle({ res, data: room })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* POST a room . */
router.post('/', async function (req, res, next) {
    try {
        // if (rooms.some((v) => v.id == req.body.id)) {
        //     res.status(400).send('ID da ton tai')
        // } else {
        console.log(req.user._id)
        const room = new roomModel({
            name: req.body.name,
            roomId: genId(ROOM_ID_LENGTH),
            owner: req.user._id,
        })
        await room.save()
        resHandle({ res, data: room })
        // }
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* PUT  edit a room . */
router.put('/:id', async function (req, res, next) {
    try {
        const room = await roomModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        )
        resHandle({ res, data: room })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

/* DELETE delete a room . */
router.delete('/:id', async function (req, res, next) {
    try {
        const room = await roomModel.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
            },
            {
                new: true,
            }
        )
        resHandle({ res, data: room })
    } catch (error) {
        console.error(error)
        resHandle({ res, status: false, data: error.message })
    }
})

module.exports = router
