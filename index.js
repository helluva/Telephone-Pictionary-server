
const globals = require('./globals.js')
let server = require('./server.js')

server.listen(globals.PORT)
console.log('SERVER LISTENING ON PORT', globals.PORT)
