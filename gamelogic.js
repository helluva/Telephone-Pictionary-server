

function generateCycle(channel) {

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





function clientProvidedCaption(client, caption) {

}

function clientProvidedImage(client, imageBase64) {

}
