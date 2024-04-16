const nodemailer = require('nodemailer')
const { email: emailConfig } = require('../config.json')

const transporter = nodemailer.createTransport({
    host: emailConfig.Host,
    port: emailConfig.Port,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
        user: emailConfig.Username,
        pass: emailConfig.Password,
    },
})

// async..await is not allowed in global scope, must use a wrapper
module.exports = async function (subject, content, html, ...desEmails) {
    console.log("sending email...")
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"Another Chat App" <support@another-chat-app.com>', // sender address
        to: desEmails.join(', '), // list of receivers
        subject: subject, // Subject line
        text: content, // plain text body
        html: html, // html body
    })

    console.log('Message sent: %s', info.messageId)
    // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
}
