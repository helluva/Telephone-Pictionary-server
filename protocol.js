
const globals = require('./globals.js')
const gamelogic = require('./gamelogic.js')


/********************************/

let nextChannelID = 0
let channels = {}

/********************************/





function parse(client, message) {

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
    } else if (func == 'startGame') {
        handleStartGame(new ResponseRequest(client, msgID))
    } else if (func == 'provideCaption') {
        handleProvideCaption(new ResponseRequest(client, msgID), arg)
    } else if (func == 'provideImage') {
        handleProvideImage(new ResponseRequest(client, msgID), arg)
    }

}











function handleRequestHostNewGame(rr, name, hostUsername) {
    rr.client.username = hostUsername
    createChannel(name, rr.client)
    rr.client.host = true
    rr.respond('ACCEPTED')
}

function handleRequestListOfChannels(rr) {
    str = ''
    let first = true
    for (let channelID in channels) {
        if (!channels[channelID].playing) {
            if (!first) {
                str += ';'
            }
            str += channelID + ',' + channels[channelID].name
        }
    }
    rr.respond(str)
}

function handleRequestJoinChannel(rr, username, channelID, pass) {
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
}

function handleRequestBroadcast(rr, broadcast) {
    if (broadcast == 'playersInLobby') {
        if (rr.client.channel != null && rr.client.channel != undefined) {
            lobbyPlayerListBroadcast.sendTo(rr.client.channel)
        }
    }
}

function handleStartGame(rr) {
    if (rr.client.host && rr.client.channel.clients.length >= 2) {
        rr.respond('ACCEPTED')
        rr.client.channel.playing = true
        startGameBroadcast.sendTo(rr.client.channel)
    } else {
        rr.respond('DENIED')
    }
}

function handleProvideCaption(rr, caption) {
    gamelogic.clientProvidedCaption(rr.client, caption)
    rr.respond('THANKS!')
}

function handleProvideImage(rr, imageBase64) {
    gamelogic.clientProvidedImage(rr.client, imageBase64)
    rr.respond('THANKS!')
}















function Channel(name) {

    this.name = name
    this.clients = []
    this.playing = false
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









function createChannel(name, hostClient) {
    channel = new Channel(name)
    channel.clients.push(hostClient)
    hostClient.channel = channel
    channels[nextChannelID++] = channel
}




























module.exports = {

    parseAndHandle : function(client, message) {
        parse(client, message)
    }

}
