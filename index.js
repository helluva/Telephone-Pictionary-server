
const globals = require('./globals.js')
let server = require('./server.js')
let protocol = require('./protocol.js')

server.listen(globals.PORT)
console.log('SERVER LISTENING ON PORT', globals.PORT)

let chron = function() {
    protocol.chron()
    setTimeout(chron, 3000)
}
