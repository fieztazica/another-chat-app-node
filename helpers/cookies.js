function cookieExtractor(cookieString) {
    return Object.fromEntries(
        cookieString
            .trim()
            .split(';')
            .map((cookie) => cookie.trim().split('='))
    )
}

module.exports = cookieExtractor
