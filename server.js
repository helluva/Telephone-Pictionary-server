
let net = require('net')

const globals = require('./globals.js')
const protocol = require('./protocol.js')


let server = net.createServer(function(socket) {

    console.log('New connection:', (new Date()).toISOString() + ' - ' + JSON.stringify(socket.address()))

    socket.setEncoding('utf8')

    let client = new Client(socket)

    client.send('ACK - CONNECTED')

    socket.on('data', function(data) {
        let dataString = data.toString().trim()
        console.log('Received data:', dataString)
        protocol.parseAndHandle(client, dataString)
    })

    socket.on('error', function() {
        console.log('SOCKET ERROR')
        client.end()
    })

    socket.on('end', function() {
        console.log('A client disconnected')
        client.end()
    })

})

server.on('error', function() {
    console.log('SERVER ERROR')
})

server.listen(globals.PORT)

console.log('SERVER LISTENING ON PORT', globals.PORT)







let userNumber = 0

function Client(socket) {

    this.socket = socket
    this.username = 'user' + (userNumber++)
    this.channel = null
    this.host = false

    this.send = function(str, log = true) {
        socket.write(str + '\r\n')
        if (log) {
            console.log('Sent data:', str)
        }
    }

    this.end = function() {
        if (this.channel != null) {
            this.channel.remove(this)
        }
    }

}
