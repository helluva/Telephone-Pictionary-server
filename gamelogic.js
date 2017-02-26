

function generateCycle(channel) {

    /*
     * http://stackoverflow.com/a/12646864
     */
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    let toShuffle = [];
    for (let i = 0; i < channel.clients.length; ++i) {
        toShuffle.push(channel.clients[i])
    }

    let shuffled = shuffleArray(toShuffle)

    return shuffled
}




function Game(channel) {

    this.order = generateCycle(channel)

    this.rounds = [new Array(this.order.length)]
    this.clientCounter = 0

    this.currentType = 'caption'

    this.advanceRound = function() {

        console.log(this.rounds.length, this.order.length)

        if (this.rounds.length == this.order.length) {
            return false
        }

        this.currentType = this.currentType == 'caption' ? 'image' : 'caption'

        this.rounds.push(new Array(this.order.length))

        this.clientCounter = 0

        return true
    }

    this.clientProvidedCaption = function(client, caption) {
        this.rounds[this.rounds.length - 1][this.order.indexOf(client)] = [client.username, caption]
        ++this.clientCounter
        if (this.clientCounter == this.rounds[this.rounds.length - 1].length) {
            return true
        }
        return false
    }

    this.clientProvidedImage = function(client, image) {
        this.rounds[this.rounds.length - 1][this.order.indexOf(client)] = [client.username, image]
        ++this.clientCounter
        if (this.clientCounter == this.rounds[this.rounds.length - 1].length) {
            return true
        }
        return false
    }

    this.whichType = function() {
        return this.currentType
    }

    this.getNext = function(client) {
        return this.rounds[this.rounds.length - 2][(this.order.indexOf(client) + this.rounds.length - 1) % this.order.length][1] // i hope this is okay
    }

}



module.exports = {
    Game : Game
}
