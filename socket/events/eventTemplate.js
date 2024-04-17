/**
 * Inject props to listener
 * @param {import("socket.io").Socket} socket
 * @param  {...any} props
 * @returns listener
 */
const listener = (socket, ...props) => async function (data, ack) {}

module.exports = listener
