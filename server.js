
var net = require('net')

const PORT = 1337


var clientRegistry = {}


var server = net.createServer(function(socket) {

    socket.setEncoding('utf8')

    var client = {
        socket : socket,
        game : null,
        player : null
    }

    socket.write('ACK1\r\n')
    client.socket.write('ACK2\r\n')

    console.log("New connection: " + (new Date()).toISOString() + ' - ' + JSON.stringify(socket.address()))

    socket.on('data', function(data) {
        handleData(client, data)
    })

    socket.on('error', function() {
        console.log('SOCKET ERROR')
        clientEnd(client)
    })

    socket.on('end', function() {
        console.log('DISCONNECTED: ' + JSON.stringify(socket.address()))
        clientEnd(client)
    })

})

server.on('error', function() {
    console.log('SERVER ERROR')
})

server.listen(PORT)









function handleData(client, data) {

    var dataString = data.toString().trim()

    console.log('received: ' + dataString)

    var msgID, msg
    [msgID, msg] = dataString.split('/')


    var msgf = msg.split(':')
    if (msgf[0] == 'hostGame') {
        var args = msgf[1].split(',')
        requestedHosting(client, args[0], args[1])
    } else if (msgf[0] == 'requestListOfGames') {
        client.socket.write(msgID + '/' + requestedListOfGames() + '\r\n')
    } else if (msgf[0] == 'joinGame') {
        var args = msgf[1].split(',')
        client.socket.write(msgID + '/' + requestJoin(client, msgf[0], msgf[1]) + '\r\n')
    }
}















function clientEnd(client) {
    if (client.game != null) {
        playerLeave(client.player, client.game)
    }
}




















var nextGameID = 0


var games = {}

function Player(client, name) {
    this.client = client
    this.name = name
}

function Game(gameName) {
    this.name = gameName
    this.id = nextGameID++
    this.lobby = true
    this.players = []
    this.deleted = false
}

function broadcastLobbies(game) {
    var lastPlayersLength = 0
    if (game.players.length != lastPlayersLength) {
        var str = 'playersInLobby/'
        for (var i = 0; i < game.players.length; ++i) {
            if (i != 0) {
                str += ','
            }
            str += game.players[i].name
        }
        for (var i = 0; i < game.players.length; ++i) {
            game.players[i].client.socket.write(str + '\r\n')
        }
        lastPlayersLength = game.players.length
    }
    if (!game.deleted) {
        setTimeout(function() { broadcastLobbies(game) }, 3000)
    }
}

function requestedHosting(client, hostUsername, gameName) {
    var game = new Game(gameName)
    var player = new Player(client, hostUsername)

    console.log('created game: ' + JSON.stringify(game))

    client.game = game
    client.player = player

    game.players.push(player)
    games[nextGameID++] = game

    setTimeout(function() { broadcastLobbies(game) }, 3000)
}

function requestedListOfGames() {

    var gameListStr = ''

    var first = true
    for (var i = 0; i < games.length; ++i) {
        if (games[i].lobby) {
            if (!first) {
                gameListStr += ';'
                first = false
            }
            gameListStr += games[i].id + ',' + games[i].name
        }
    }

    return gameListStr

}

function requestJoin(client, playerName, gameID) {
    var player = new Player(client, playerName)
    client.game = games[gameID]
    client.player = player
    games[gameID].push(player)
}

function playerLeave(client, game) {
    client.game = null
    client.player = null
}
