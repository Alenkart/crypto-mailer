
module.exports = (text, size) => text + " ".repeat( size || 12 - (""+text).toString().length ) 