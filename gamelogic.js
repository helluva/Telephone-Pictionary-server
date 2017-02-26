

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

        this.currentType = this.currentType == 'caption' ? 'image' : 'caption'

        this.rounds.push(new Array(this.order.length))

        this.clientCounter = 0
    }

    this.clientProvidedCaption = function(client, caption) {
        this.rounds[this.rounds.length - 1][this.order.indexOf(client)] = caption
        ++this.clientCounter
        if (this.clientCounter == this.rounds[this.rounds.length - 1].length) {
            return true
        }
        return false
    }

    this.clientProvidedImage = function(client, image) {
        this.rounds[this.rounds.length - 1][this.order.indexOf(client)] = image
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
        return this.rounds[this.rounds.length - 2][(this.order.indexOf(client) + 1) % this.order.length] // i hope this is okay
    }

}



module.exports = {
    Game : Game
}
