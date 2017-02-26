
var net = require('net')

const PORT = 1337


var server = net.createServer(function(socket) {

    socket.setEncoding('utf8')

    var client = new Client(socket)

    client.send('ACK - CONNECTED')

    console.log('New connection:', (new Date()).toISOString() + ' - ' + JSON.stringify(socket.address()))

    socket.on('data', function(data) {
        var dataString = data.toString().trim()
        console.log('Received data:', dataString)
        handleData(client, dataString)
    })

    socket.on('error', function() {
        console.log('SOCKET ERROR')
        clientEnd(client)
    })

    socket.on('end', function() {
        console.log('A client disconnected')
        clientEnd(client)
    })

})

server.on('error', function() {
    console.log('SERVER ERROR')
})

server.listen(PORT)





function Client(socket) {

    this.socket = socket
    this.game = null
    this.player = null

    this.send = function(str) {
        socket.write(str + '\r\n')
        console.log('Sent data:', str)
    }

}






function handleData(client, data) {

    var msgID, msg
    [msgID, msg] = data.split('/')

    var msgf = msg.split(':')
    if (msgf[0] == 'hostGame') {
        var args = msgf[1].split(',')
        requestedHosting(client, args[0], args[1])
    } else if (msgf[0] == 'requestListOfGames') {
        client.send(msgID + '/' + getListOfGamesStr())
    } else if (msgf[0] == 'joinGame') {
        var args = msgf[1].split(',')
        client.send(msgID + '/' + requestJoin(client, args[0], args[1]))
    } else if (msgf[0] == 'requestRebroadcast') {
        if (msgf[1] == 'playersInLobby') {
            client.send(getBroadcastLobbyStr(client.game))
        }
    } else if (msgf[0] == 'startGame') {
        hostStartedGame(client)
    }

}















function clientEnd(client) {
    if (client.game != null) {
        playerLeft(client.game, client)
    }
}













// game states
const LOBBY = 0
const VIEWING = 2


var nextGameID = 0


var games = {}

function Player(client, name) {
    this.client = client
    this.host = false
    this.name = name
}

function Game(gameName) {
    this.name = gameName
    this.players = []
    this.state = LOBBY
    this.deleted = false

    this.send = function(str) {
        console.log('BROADCASTING:')
        for (var i = 0; i < this.players.length; ++i) {
            this.players[i].client.send(str)
        }
    }
}

function getBroadcastLobbyStr(game) {
    var str = 'playersInLobby/'
    for (var i = 0; i < game.players.length; ++i) {
        if (i != 0) {
            str += ','
        }
        str += game.players[i].name
    }
    return str
}

function broadcastLobbyToLobby(game) {
    var lastPlayersLength = 0
    if (game.players.length != lastPlayersLength) {
        game.send(getBroadcastLobbyStr(game))
        lastPlayersLength = game.players.length
    }
}

function requestedHosting(client, hostUsername, gameName) {
    var game = new Game(gameName)
    var player = new Player(client, hostUsername)
    player.host = true

    client.game = game
    client.player = player

    game.players.push(player)
    games[nextGameID++] = game

    console.log('Client (' + hostUsername + ') created game', game)

    broadcastLobbyToLobby(game)
}

function getListOfGamesStr() {

    var gameListStr = ''

    var first = true
    for (var gameID in games) {
        if (games[gameID].state == LOBBY) {
            if (!first) {
                gameListStr += ';'
            }
            gameListStr += gameID + ',' + games[gameID].name
            first = false
        }
    }

    return gameListStr
}

function requestJoin(client, playerName, gameID) {

    if (!games[gameID].state == LOBBY) {
        return 'NO'
    }

    var player = new Player(client, playerName)
    client.game = games[gameID]
    client.player = player
    games[gameID].players.push(player)

    broadcastLobbyToLobby(games[gameID])

    return 'JOINED'
}

function hostStartedGame(client) {
    if (client.player.host && client.game.players.length > 1) {
        client.game.send('gameStarted/')
    }
}

function playerLeft(game, client) {

    game.players.splice(game.players.indexOf(client), 1)

    broadcastLobbyToLobby(game)

    client.game = null
    client.player = null

}
