
const globals = require('./globals.js')

const gamelogic = require('./gamelogic.js')


/********************************/

let nextChannelID = 0
let channels = {}

/********************************/





function parseAndHandle(client, message) {

    let msgID, body
    [msgID, body] = message.split('/')

    let func, arg
    [func, arg] = body.split(':')

    if (func == 'hostGame') {
        handleRequestHostNewGame(new ResponseRequest(client, msgID), ...arg.split(','))
    } else if (func == 'requestListOfGames') {
        handleRequestListOfChannels(new ResponseRequest(client, msgID))
    } else if (func == 'joinGame') {
        handleRequestJoinChannel(new ResponseRequest(client, msgID), ...arg.split(','))
    } else if (func == 'requestBroadcast' || func == 'requestRebroadcast') {
        handleRequestBroadcast(new ResponseRequest(client, msgID), arg)
    } else if (func == 'playerLeave') {
        handlePlayerLeave(new ResponseRequest(client, msgID))
    } else if (func == 'startGame') {
        handleStartGame(new ResponseRequest(client, msgID))
    } else if (func == 'provideCaption') {
        handleProvideCaption(new ResponseRequest(client, msgID), arg)
    } else if (func == 'provideImage') {
        //setTimeout(function() { client.send('nextImage/' + arg) }, 1000)
        handleProvideImage(new ResponseRequest(client, msgID), arg)
    }

}











function handleRequestHostNewGame(rr, name, hostUsername) {

    if (rr.client.channel) {
        rr.client.channel.remove(rr.client)
    }

    rr.client.username = hostUsername
    createChannel(name, rr.client)
    rr.client.host = true
    rr.respond('ACCEPTED')

    pruneChannels();
}

function handleRequestListOfChannels(rr) {
    str = ''
    let first = true
    for (let channelID in channels) {
        if (!channels[channelID].playing && !channels[channelID].deleted) {
            if (!first) {
                str += ';'
            }
            str += channelID + ',' + channels[channelID].name
            first = false
        }
    }
    rr.respond(str)
}

function handleRequestJoinChannel(rr, username, channelID, pass) {

    if (rr.client.channel) {
        rr.client.channel.remove(rr.client)
    }

    rr.client.username = username
    if (channels[channelID].playing) {
        rr.respond('CANNOT_JOIN_MID_GAME')
        return
    }
    if (channels[channelID].clients.length >= globals.CHANNEL_MAX_SIZE) {
        rr.respond('ROOM_FULL')
        return
    }
    if (pass != channels[channelID].password) {
        rr.respond('WRONG_PASSWORD')
        return
    }
    channels[channelID].clients.push(rr.client)
    rr.client.channel = channels[channelID]
    rr.respond('JOINED')

    pruneChannels();
}

function handleRequestBroadcast(rr, broadcast) {
    if (broadcast == 'playersInLobby') {
        if (rr.client.channel != null && rr.client.channel != undefined) {
            lobbyPlayerListBroadcast.sendTo(rr.client.channel)
        }
    }
}

function handlePlayerLeave(rr) {

    if (rr.client.channel) {
        rr.client.channel.remove(rr.client)
    }

    rr.respond('YOU DOG, YOU')
}

function handleStartGame(rr) {
    if (rr.client.host) {
        rr.client.channel.playing = true
        rr.respond('ACCEPTED')
        rr.client.channel.game = new gamelogic.Game(rr.client.channel)
        startGameBroadcast.sendTo(rr.client.channel)
    } else {
        rr.respond('DENIED')
    }
}

function handleProvideCaption(rr, caption) {
    rr.respond('THANKS!')
    if (!rr.client.channel || !rr.client.channel.game) {
        return // for debugging
    }
    if (rr.client.channel.game.clientProvidedCaption(rr.client, caption)) { // if last
        setTimeout(function() { forwardNextRoundBatch(rr.client.channel) }, 500)
    }
}

function handleProvideImage(rr, image) {
    rr.respond('THANKS!')
    if (!rr.client.channel || !rr.client.channel.game) {
        return // for debugging
    }
    if (rr.client.channel.game.clientProvidedImage(rr.client, image)) { // if last
        setTimeout(function() { forwardNextRoundBatch(rr.client.channel) }, 500)
    }
}











/***************/

let chron = function() {
    pruneChannels()
    console.log(channels)
}

/***************/










function Channel(name) {

    this.name = name
    this.clients = []
    this.playing = false
    this.game = null
    this.deleted = false

    this.send = function(str, log = true) {
        if (log != false) {
            console.log('BROADCASTING:')
        }
        for (let i = 0; i < this.clients.length; ++i) {
            this.clients[i].send(str, log)
        }
    }

    this.remove = function(client) {
        this.clients.splice(this.clients.indexOf(client), 1)
        if (client.host) {
            this.close()
        }
    }

    this.close = function() {
        this.send('hostLeft')
        for (let i = 0; i < this.clients.length; ++i) {
            this.clients[i].channel = null
        }
        this.clients = []
        this.deleted = true
    }

}

function Broadcast(msgID, bodyStringFunc = null) {

    this.msgID = msgID
    this.bodyStringFunc = bodyStringFunc

    this.string = function(channel) {
        if (this.bodyStringFunc == null) {
            return msgID
        }
        return (msgID + '/' + this.bodyStringFunc(channel))
    }

    this.sendTo = function(channel) {
        channel.send(this.string(channel))
    }

}

function ResponseRequest(client, msgID) {

    this.client = client
    this.msgID = msgID

    this.respond = function(message) {
        client.send(msgID + '/' + message)
    }

    this.emulateBroadcast = function(broadcast) {
        client.send(broadcast.string(client.channel))
    }

}




















let lobbyPlayerListBroadcast = new Broadcast('playersInLobby', function(channel) {
    let str = ''
    for (let i = 0; i < channel.clients.length; ++i) {
        if (i != 0) {
            str += ','
        }
        str += channel.clients[i].username
    }
    return str
})

let startGameBroadcast = new Broadcast('gameStarted')

let endGameBroadcast = new Broadcast('gameEnded')
















function createChannel(name, hostClient) {
    channel = new Channel(name)
    channel.clients.push(hostClient)
    hostClient.channel = channel
    channels[nextChannelID++] = channel
}

function pruneChannels() {
    for (let channelID in channels) {
        if (channels[channelID].clients.length < 1) {
            delete channels[channelID]
        }
    }
}

















function forwardNextRoundBatch(channel) {

    let lastType = channel.game.whichType()

    if (!channel.game.advanceRound()) {
        endGame(channel)
        return
    }

    let msgID = lastType == 'caption' ? 'nextCaption' : 'nextImage'

    for (let i = 0; i < channel.clients.length; ++i) {
        channel.clients[i].send(msgID + '/' + channel.game.getNext(channel.clients[i]))
    }
}


function endGame(channel) {
    endGameBroadcast.sendTo(channel)

    let delay = function() {
        type = 'caption'
        for (let i = 0; i < channel.game.rounds.length; ++i) {
            for (let j = 0; j < channel.game.order.length; ++j) {
                channel.game.order[j].send('roundHistory' + '/' + i + ',' + channel.game.rounds[i][j][0] + ',' + type + ':' + channel.game.rounds[i][j][1])
            }
            type = type == 'caption' ? 'image' : 'caption'
        }

        channel.send('GLHF')

        channel.close()
    }

    setTimeout(delay, 300)

}




















module.exports = {

    parseAndHandle : parseAndHandle,
    chron : chron

}
