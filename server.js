
let net = require('net')

const protocol = require('./protocol.js')


let server = net.createServer(function(socket) {

    console.log('New connection:', (new Date()).toISOString() + ' - ' + JSON.stringify(socket.address()))

    socket.setEncoding('utf8')

    let client = new Client(socket)

    client.send('ACK - CONNECTED')

    let ghetto_buffer = ''
    socket.on('data', function(data) {
        let dataString = data.toString()
        if (dataString.indexOf("\n") >= 0) {
            let dataStrings = dataString.split("\n")
            for (let i = 0; i < dataStrings.length - 1; ++i) {
                let finalized = ghetto_buffer + dataStrings[i].trim()
                console.log('Received data:', finalized)
                protocol.parseAndHandle(client, finalized)
            }
            ghetto_buffer = ''
        } else {
            ghetto_buffer += dataString.trim()
        }
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


module.exports = server




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
