
var net = require('net')

var PORT = 1337

var server = net.createServer(function(socket) {
    console.log('recieved connection: ' + JSON.stringify(socket.address()));
	socket.write('Hello, I am a server at port ' + PORT + '\r\n')
    socket.write('I have recieved a connection from ' + JSON.stringify(socket.address()) + '\r\n')
});

server.listen(PORT)
